import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'
import type { Category } from '@/types'

// GET: monthly recap comparing current vs previous month
export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const targetMonth = searchParams.get('month') // optional: '2026-04'

  const now = new Date()
  let year = now.getFullYear()
  let month = now.getMonth() // 0-indexed

  if (targetMonth) {
    const [y, m] = targetMonth.split('-').map(Number)
    year = y
    month = m - 1
  }

  // Current month range
  const curFrom = new Date(year, month, 1).toISOString().split('T')[0]
  const curTo = new Date(year, month + 1, 0).toISOString().split('T')[0]

  // Previous month range
  const prevFrom = new Date(year, month - 1, 1).toISOString().split('T')[0]
  const prevTo = new Date(year, month, 0).toISOString().split('T')[0]

  const db = createServiceClient()

  // Fetch both months
  const [curRes, prevRes] = await Promise.all([
    db.from('transactions').select('amount, category')
      .eq('user_id', session.user.id)
      .gte('date', curFrom).lte('date', curTo),
    db.from('transactions').select('amount, category')
      .eq('user_id', session.user.id)
      .gte('date', prevFrom).lte('date', prevTo),
  ])

  function summarize(txs: { amount: number; category: string }[]) {
    let income = 0, expenses = 0
    const byCategory: Record<string, number> = {}
    for (const tx of txs) {
      if (tx.amount > 0) income += tx.amount
      else {
        expenses += Math.abs(tx.amount)
        byCategory[tx.category] = (byCategory[tx.category] ?? 0) + Math.abs(tx.amount)
      }
    }
    return { income, expenses, balance: income - expenses, byCategory }
  }

  const current = summarize(curRes.data ?? [])
  const previous = summarize(prevRes.data ?? [])

  // Find category that grew most
  let topCategory: { category: Category; total: number; diff: number } | null = null
  let maxDiff = 0
  for (const [cat, total] of Object.entries(current.byCategory)) {
    const prevTotal = previous.byCategory[cat] ?? 0
    const diff = total - prevTotal
    if (diff > maxDiff) {
      maxDiff = diff
      topCategory = { category: cat as Category, total, diff }
    }
  }

  return NextResponse.json({
    current: { income: current.income, expenses: current.expenses, balance: current.balance },
    previous: { income: previous.income, expenses: previous.expenses, balance: previous.balance },
    diff: {
      income: current.income - previous.income,
      expenses: current.expenses - previous.expenses,
      balance: current.balance - previous.balance,
    },
    topCategory,
    savedMore: current.balance > previous.balance,
    currentCategories: current.byCategory,
    previousCategories: previous.byCategory,
  })
}
