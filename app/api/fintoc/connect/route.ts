import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'
import { getAccounts } from '@/lib/fintoc'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { link_token } = await req.json()
  if (!link_token) return NextResponse.json({ error: 'link_token requerido' }, { status: 400 })

  try {
    const accounts = await getAccounts(link_token)
    if (!accounts.length) {
      return NextResponse.json({ error: 'No se encontraron cuentas' }, { status: 404 })
    }

    const account = accounts[0] // Usar primera cuenta
    const db = createServiceClient()

    // Guardar/actualizar cuenta
    const { data, error } = await db
      .from('accounts')
      .upsert({
        user_id: session.user.id,
        fintoc_link_token: link_token,
        bank_name: account.institution.name,
        account_number_last4: account.number.slice(-4),
        account_type: account.type,
        currency: account.currency,
        balance: account.balance.available,
      }, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ account: data, fintoc_account_id: account.id })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
