import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'
import { getAccounts, getMovements } from '@/lib/fintoc'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const db = createServiceClient()

  const { data: savedAccount } = await db
    .from('accounts')
    .select('*')
    .eq('user_id', session.user.id)
    .single()

  const linkToken = savedAccount?.fintoc_link_token ?? process.env.FINTOC_LINK_TOKEN
  if (!linkToken) return NextResponse.json({ error: 'No hay link token' }, { status: 404 })

  try {
    const fintocAccounts = await getAccounts(linkToken)
    if (!fintocAccounts.length) throw new Error('Sin cuentas en Fintoc')

    const fintocAccount =
      fintocAccounts.find(a => a.type === 'checking_account') ?? fintocAccounts[0]

    // Guardar cuenta en DB si no existe
    let dbAccountId = savedAccount?.id
    if (!savedAccount) {
      const { data: newAccount } = await db
        .from('accounts')
        .upsert({
          user_id: session.user.id,
          fintoc_link_token: linkToken,
          bank_name: fintocAccount.institution?.name ?? 'Banco Santander',
          account_number_last4: fintocAccount.number.slice(-4),
          account_type: fintocAccount.type,
          currency: fintocAccount.currency,
          balance: fintocAccount.balance.available,
        }, { onConflict: 'user_id' })
        .select()
        .single()
      dbAccountId = newAccount?.id
    }

    // Últimos 3 meses
    const since = new Date()
    since.setMonth(since.getMonth() - 3)

    const movements = await getMovements(linkToken, fintocAccount.id, {
      since: since.toISOString().split('T')[0],
      per_page: 300,
    })

    if (!movements.length) {
      return NextResponse.json({ synced: 0, message: 'Sin movimientos nuevos' })
    }

    // Filtrar duplicados
    const fintocIds = movements.map(m => m.id)
    const { data: existing } = await db
      .from('transactions')
      .select('fintoc_id')
      .in('fintoc_id', fintocIds)

    const existingIds = new Set((existing ?? []).map(e => e.fintoc_id))
    const newMovements = movements.filter(m => !existingIds.has(m.id))

    if (!newMovements.length) {
      return NextResponse.json({ synced: 0, message: 'Todo al día ✓' })
    }

    // Guardar SIN enriquecer (rápido)
    const rows = newMovements.map(m => ({
      user_id: session.user.id,
      fintoc_id: m.id,
      amount: m.amount,
      description_raw: m.description,
      merchant: m.description.slice(0, 40),
      category: 'otro',
      type: m.amount > 0 ? 'ingreso' : 'compra',
      date: (m.transaction_date ?? m.post_date ?? '').split('T')[0],
      account_id: dbAccountId ?? null,
      enriched: false,
    }))

    const { error } = await db.from('transactions').insert(rows)
    if (error) throw error

    // Actualizar balance
    if (dbAccountId) {
      await db.from('accounts')
        .update({ balance: fintocAccount.balance.available })
        .eq('id', dbAccountId)
    }

    return NextResponse.json({
      synced: rows.length,
      message: `${rows.length} transacciones importadas. Ejecuta /api/enrich para categorizar.`,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
