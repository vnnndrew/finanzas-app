import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'

// GET: list budgets with current month spending
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const db = createServiceClient()

  // Get budgets
  const { data: budgets, error } = await db
    .from('budgets')
    .select('*')
    .eq('user_id', session.user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Get current month spending per category
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

  const { data: transactions } = await db
    .from('transactions')
    .select('category, amount')
    .eq('user_id', session.user.id)
    .gte('date', from)
    .lte('date', to)
    .lt('amount', 0) // only expenses

  // Sum spending per category
  const spending: Record<string, number> = {}
  for (const tx of transactions ?? []) {
    spending[tx.category] = (spending[tx.category] ?? 0) + Math.abs(tx.amount)
  }

  // Merge budgets with spending
  const result = (budgets ?? []).map(b => ({
    ...b,
    spent: spending[b.category] ?? 0,
    percentage: b.amount > 0 ? Math.round(((spending[b.category] ?? 0) / b.amount) * 100) : 0,
  }))

  return NextResponse.json({ budgets: result })
}

// POST: create or update a budget
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { category, amount } = await req.json()
  if (!category || !amount || amount <= 0) {
    return NextResponse.json({ error: 'Categoría y monto requeridos' }, { status: 400 })
  }

  const db = createServiceClient()

  const { data, error } = await db
    .from('budgets')
    .upsert(
      { user_id: session.user.id, category, amount },
      { onConflict: 'user_id,category' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ budget: data })
}

// DELETE: remove a budget
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { category } = await req.json()

  const db = createServiceClient()
  const { error } = await db
    .from('budgets')
    .delete()
    .eq('user_id', session.user.id)
    .eq('category', category)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
