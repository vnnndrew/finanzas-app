// Ruta para guardar el link_token existente sin pasar por el widget
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'
import { getAccounts } from '@/lib/fintoc'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const linkToken = process.env.FINTOC_LINK_TOKEN
  if (!linkToken) return NextResponse.json({ error: 'FINTOC_LINK_TOKEN no configurado' }, { status: 500 })

  try {
    const accounts = await getAccounts(linkToken)
    if (!accounts.length) return NextResponse.json({ error: 'Sin cuentas' }, { status: 404 })

    const account = accounts[0]
    const db = createServiceClient()

    const { data, error } = await db
      .from('accounts')
      .upsert({
        user_id: session.user.id,
        fintoc_link_token: linkToken,
        bank_name: account.institution.name,
        account_number_last4: account.number.slice(-4),
        account_type: account.type,
        currency: account.currency,
        balance: account.balance.available,
      }, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ ok: true, account: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
