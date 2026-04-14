import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'

// Marca todas las transacciones como no-enriquecidas para re-procesar
export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const db = createServiceClient()
  const { data } = await db
    .from('transactions')
    .update({ enriched: false, category: 'otro', merchant: '' })
    .eq('user_id', session.user.id)
    .select('id')

  const count = data?.length ?? 0
  return NextResponse.json({ reset: count, message: `${count} transacciones marcadas para re-categorizar` })
}
