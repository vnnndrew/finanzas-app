import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'

// GET: get current month savings goal + progress
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const now = new Date()
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

  const db = createServiceClient()

  // Get goal
  const { data: goal } = await db
    .from('savings_goals')
    .select('*')
    .eq('user_id', session.user.id)
    .eq('month', month)
    .single()

  // Get income and expenses for month
  const { data: transactions } = await db
    .from('transactions')
    .select('amount')
    .eq('user_id', session.user.id)
    .gte('date', from)
    .lte('date', to)

  let income = 0
  let expenses = 0
  for (const tx of transactions ?? []) {
    if (tx.amount > 0) income += tx.amount
    else expenses += Math.abs(tx.amount)
  }

  const saved = income - expenses
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysPassed = now.getDate()
  const expectedProgress = goal ? (daysPassed / daysInMonth) * goal.amount : 0
  const onTrack = goal ? saved >= expectedProgress : true

  return NextResponse.json({
    goal,
    progress: {
      saved,
      income,
      expenses,
      percentage: goal && goal.amount > 0 ? Math.round((saved / goal.amount) * 100) : 0,
      onTrack,
      expectedProgress: Math.round(expectedProgress),
    },
  })
}

// POST: set savings goal for current month
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { amount } = await req.json()
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'Monto requerido' }, { status: 400 })
  }

  const now = new Date()
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const db = createServiceClient()

  const { data, error } = await db
    .from('savings_goals')
    .upsert(
      { user_id: session.user.id, amount, month },
      { onConflict: 'user_id,month' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ goal: data })
}
