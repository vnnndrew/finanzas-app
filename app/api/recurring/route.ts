import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'

// GET: detect recurring/fixed expenses (appear 2+ months)
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const db = createServiceClient()

  // Look at last 4 months of expenses
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().split('T')[0]

  const { data: transactions } = await db
    .from('transactions')
    .select('merchant, category, amount, date')
    .eq('user_id', session.user.id)
    .lt('amount', 0)
    .gte('date', from)
    .order('date', { ascending: false })

  if (!transactions?.length) {
    return NextResponse.json({ recurring: [], totalFixed: 0 })
  }

  // Group by merchant, track which months they appear
  const merchantMap: Record<string, {
    category: string
    amounts: number[]
    months: Set<string>
    lastDate: string
  }> = {}

  for (const tx of transactions) {
    const key = tx.merchant?.trim().toLowerCase()
    if (!key || key.length < 2) continue

    const monthKey = tx.date.slice(0, 7) // '2026-04'

    if (!merchantMap[key]) {
      merchantMap[key] = {
        category: tx.category,
        amounts: [],
        months: new Set(),
        lastDate: tx.date,
      }
    }
    merchantMap[key].amounts.push(Math.abs(tx.amount))
    merchantMap[key].months.add(monthKey)
    if (tx.date > merchantMap[key].lastDate) {
      merchantMap[key].lastDate = tx.date
    }
  }

  // Filter: must appear in at least 2 different months
  const recurring = Object.entries(merchantMap)
    .filter(([, v]) => v.months.size >= 2)
    .map(([merchant, v]) => ({
      merchant: merchant.charAt(0).toUpperCase() + merchant.slice(1),
      category: v.category,
      avgAmount: Math.round(v.amounts.reduce((a, b) => a + b, 0) / v.amounts.length),
      months: v.months.size,
      lastDate: v.lastDate,
    }))
    .sort((a, b) => b.avgAmount - a.avgAmount)

  const totalFixed = recurring.reduce((sum, r) => sum + r.avgAmount, 0)

  return NextResponse.json({ recurring, totalFixed })
}
