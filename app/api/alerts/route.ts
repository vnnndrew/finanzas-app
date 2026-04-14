import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'
import type { SpendingAlert } from '@/types'

// GET: detect unusual spending patterns
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const db = createServiceClient()
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

  // Get this month's expenses with dates
  const { data: transactions } = await db
    .from('transactions')
    .select('amount, date, category')
    .eq('user_id', session.user.id)
    .lt('amount', 0)
    .gte('date', from)
    .lte('date', to)

  if (!transactions?.length) {
    return NextResponse.json({ alerts: [] })
  }

  const alerts: SpendingAlert[] = []

  // 1. Detect unusual daily spending (3x average)
  const dailySpending: Record<string, number> = {}
  for (const tx of transactions) {
    dailySpending[tx.date] = (dailySpending[tx.date] ?? 0) + Math.abs(tx.amount)
  }

  const days = Object.entries(dailySpending)
  if (days.length >= 3) {
    const totalDaily = days.reduce((s, [, v]) => s + v, 0)
    const avgDaily = totalDaily / days.length

    for (const [date, amount] of days) {
      if (amount >= avgDaily * 3) {
        alerts.push({
          type: 'unusual_day',
          message: `Gasto inusual el ${new Date(date + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}`,
          amount,
          date,
        })
      }
    }
  }

  // 2. Check budget warnings
  const { data: budgets } = await db
    .from('budgets')
    .select('*')
    .eq('user_id', session.user.id)

  if (budgets?.length) {
    const categorySpending: Record<string, number> = {}
    for (const tx of transactions) {
      categorySpending[tx.category] = (categorySpending[tx.category] ?? 0) + Math.abs(tx.amount)
    }

    for (const budget of budgets) {
      const spent = categorySpending[budget.category] ?? 0
      const pct = budget.amount > 0 ? (spent / budget.amount) * 100 : 0

      if (pct >= 100) {
        alerts.push({
          type: 'budget_exceeded',
          message: `Superaste tu presupuesto de ${budget.category}`,
          amount: spent,
          category: budget.category,
        })
      } else if (pct >= 80) {
        alerts.push({
          type: 'budget_warning',
          message: `${Math.round(pct)}% del presupuesto de ${budget.category} usado`,
          amount: spent,
          category: budget.category,
        })
      }
    }
  }

  // Sort: exceeded first, then warnings, then unusual days
  const priority = { budget_exceeded: 0, budget_warning: 1, unusual_day: 2 }
  alerts.sort((a, b) => priority[a.type] - priority[b.type])

  return NextResponse.json({ alerts })
}
