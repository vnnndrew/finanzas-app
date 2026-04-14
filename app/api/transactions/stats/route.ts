import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'
import type { CategoryStats, MonthlyStats } from '@/types'
import { CATEGORY_CONFIG } from '@/types'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from') ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  const to = searchParams.get('to') ?? new Date().toISOString().split('T')[0]

  const db = createServiceClient()
  const { data: txs } = await db
    .from('transactions')
    .select('amount, category, date')
    .eq('user_id', session.user.id)
    .gte('date', from)
    .lte('date', to)

  if (!txs) return NextResponse.json({ error: 'Error' }, { status: 500 })

  // Stats por categoría (solo gastos, amount < 0)
  const expenses = txs.filter(t => t.amount < 0)
  const totalExpenses = expenses.reduce((s, t) => s + Math.abs(t.amount), 0)

  const catMap = new Map<string, { total: number; count: number }>()
  for (const t of expenses) {
    const existing = catMap.get(t.category) ?? { total: 0, count: 0 }
    catMap.set(t.category, {
      total: existing.total + Math.abs(t.amount),
      count: existing.count + 1,
    })
  }

  const categoryStats: CategoryStats[] = Array.from(catMap.entries())
    .map(([category, { total, count }]) => ({
      category: category as CategoryStats['category'],
      total,
      count,
      percentage: totalExpenses > 0 ? Math.round((total / totalExpenses) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total)

  // Ingresos/gastos del período
  const totalIncome = txs.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)

  // Stats por mes (últimos 6 meses)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
  sixMonthsAgo.setDate(1)

  const { data: allTxs } = await db
    .from('transactions')
    .select('amount, date')
    .eq('user_id', session.user.id)
    .gte('date', sixMonthsAgo.toISOString().split('T')[0])

  const monthMap = new Map<string, { income: number; expenses: number }>()
  for (const t of allTxs ?? []) {
    const month = t.date.slice(0, 7) // YYYY-MM
    const existing = monthMap.get(month) ?? { income: 0, expenses: 0 }
    if (t.amount > 0) existing.income += t.amount
    else existing.expenses += Math.abs(t.amount)
    monthMap.set(month, existing)
  }

  const monthlyStats: MonthlyStats[] = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { income, expenses }]) => ({
      month,
      income,
      expenses,
      balance: income - expenses,
    }))

  return NextResponse.json({
    totalIncome,
    totalExpenses,
    balance: totalIncome - totalExpenses,
    categoryStats,
    monthlyStats,
  })
}
