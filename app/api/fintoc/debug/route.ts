import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'

const FINTOC_BASE = 'https://api.fintoc.com/v1'

async function fintocRaw(path: string) {
  const res = await fetch(`${FINTOC_BASE}${path}`, {
    headers: { Authorization: process.env.FINTOC_SECRET_KEY! },
  })
  const text = await res.text()
  return { status: res.status, body: JSON.parse(text) }
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const db = createServiceClient()
  const { data: account } = await db
    .from('accounts')
    .select('fintoc_link_token')
    .eq('user_id', session.user.id)
    .single()

  const linkToken = account?.fintoc_link_token ?? process.env.FINTOC_LINK_TOKEN!

  // 1. Cuentas: GET /accounts?link_token=xxx
  const accounts = await fintocRaw(`/accounts?link_token=${linkToken}`)

  // 2. Movimientos del primer account (sin filtro de fecha)
  let movements = null
  const accountsList = Array.isArray(accounts.body) ? accounts.body : []
  if (accountsList.length > 0) {
    const accountId = accountsList[0].id
    movements = await fintocRaw(
      `/accounts/${accountId}/movements?link_token=${linkToken}&per_page=5&confirmed_only=false`
    )
  }

  return NextResponse.json({ accounts, movements }, { status: 200 })
}
