import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const db = createServiceClient()
  const { data: account } = await db
    .from('accounts')
    .select('*')
    .eq('user_id', session.user.id)
    .single()

  return NextResponse.json({ account: account ?? null })
}
