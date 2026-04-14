import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'

// GET: project end-of-month spending based on current pace
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const now = new Date()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysPassed = now.getDate()
  const daysLeft = daysInMonth - daysPassed

  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

  const db = createServiceClient()

  const { data: transactions } = await db
    .from('transactions')
    .select('amount')
    .eq('user_id', session.user.id)
    .lt('amount', 0) // only expenses
    .gte('date', from)
    .lte('date', to)

  const currentSpent = (transactions ?? []).reduce(
    (sum, tx) => sum + Math.abs(tx.amount),
    0
  )

  const dailyAvg = daysPassed > 0 ? Math.round(currentSpent / daysPassed) : 0
  const projected = currentSpent + dailyAvg * daysLeft

  return NextResponse.json({
    projected,
    currentSpent,
    dailyAvg,
    daysLeft,
    daysPassed,
    daysInMonth,
  })
}
