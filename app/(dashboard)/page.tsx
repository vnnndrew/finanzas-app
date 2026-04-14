'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { DonutChart } from '@/components/dashboard/DonutChart'
import { MonthlyLineChart } from '@/components/dashboard/LineChart'
import { TransactionRow } from '@/components/transactions/TransactionRow'
import { currentMonthRange } from '@/lib/utils'
import type { Transaction, CategoryStats, MonthlyStats, Category } from '@/types'
import { RefreshCw } from 'lucide-react'

interface Stats {
  totalIncome: number
  totalExpenses: number
  balance: number
  categoryStats: CategoryStats[]
  monthlyStats: MonthlyStats[]
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recent, setRecent] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')

  const { from, to } = currentMonthRange()

  async function fetchData() {
    setLoading(true)
    const [statsRes, txRes] = await Promise.all([
      fetch(`/api/transactions/stats?from=${from}&to=${to}`),
      fetch(`/api/transactions?limit=10&from=${from}&to=${to}`),
    ])
    const [statsData, txData] = await Promise.all([statsRes.json(), txRes.json()])
    setStats(statsData)
    setRecent(txData.transactions ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  async function handleSync() {
    setSyncing(true)
    setSyncMsg('')
    try {
      const res = await fetch('/api/fintoc/sync', { method: 'POST' })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setSyncMsg(`${data.message} Categorizando...`)

      if (data.synced > 0) {
        let remaining = true
        while (remaining) {
          const enrichRes = await fetch('/api/enrich', { method: 'POST' })
          const enrichData = await enrichRes.json()
          remaining = !enrichData.done
          setSyncMsg(`Categorizando... quedan ${enrichData.remaining}`)
        }
      }

      setSyncMsg('Sincronizado')
      await fetchData()
    } catch (err: unknown) {
      setSyncMsg(err instanceof Error ? err.message : 'Error al sincronizar')
    }
    setSyncing(false)
  }

  async function handleCategoryChange(id: string, category: Category) {
    await fetch('/api/transactions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, category }),
    })
    await fetchData()
  }

  const now = new Date()
  const monthName = now.toLocaleDateString('es-CL', { month: 'long' })
  const firstName = session?.user?.name?.split(' ')[0] ?? ''

  return (
    <div className="stagger">
      {/* Greeting */}
      <div style={{ marginBottom: '20px' }}>
        <h1
          style={{
            fontFamily: 'var(--font-syne)',
            fontWeight: 800,
            fontSize: '24px',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}
        >
          {firstName ? `Hola, ${firstName}` : 'Dashboard'}
        </h1>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '4px',
          }}
        >
          <p
            style={{
              color: 'var(--muted)',
              fontFamily: 'var(--font-syne)',
              fontSize: '13px',
              textTransform: 'capitalize',
            }}
          >
            {monthName} {now.getFullYear()}
          </p>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="press-scale"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '8px',
              background: syncing ? 'var(--card)' : 'var(--accent-dim)',
              border: '1px solid rgba(0,208,132,0.15)',
              color: syncing ? 'var(--muted)' : 'var(--accent)',
              fontFamily: 'var(--font-syne)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: syncing ? 'not-allowed' : 'pointer',
            }}
          >
            <RefreshCw
              size={13}
              style={{
                animation: syncing ? 'spin 1s linear infinite' : 'none',
              }}
            />
            {syncing ? 'Sync...' : 'Sync'}
          </button>
        </div>
      </div>

      {/* Sync message */}
      {syncMsg && (
        <div
          style={{
            marginBottom: '16px',
            padding: '10px 14px',
            borderRadius: '10px',
            background: 'var(--accent-dim)',
            border: '1px solid rgba(0,208,132,0.15)',
            color: 'var(--accent)',
            fontFamily: 'var(--font-syne)',
            fontSize: '12px',
          }}
        >
          {syncMsg}
        </div>
      )}

      {/* Stats cards — stacked */}
      {loading ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            marginBottom: '20px',
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: '72px', borderRadius: '14px' }}
            />
          ))}
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            marginBottom: '20px',
          }}
        >
          <StatsCard
            type="income"
            amount={stats?.totalIncome ?? 0}
            label="Ingresos"
          />
          <StatsCard
            type="expenses"
            amount={stats?.totalExpenses ?? 0}
            label="Gastos"
          />
          <StatsCard
            type="balance"
            amount={stats?.balance ?? 0}
            label="Balance"
          />
        </div>
      )}

      {/* Category donut */}
      <div className="card" style={{ padding: '16px', marginBottom: '12px' }}>
        <h2
          style={{
            fontFamily: 'var(--font-syne)',
            fontWeight: 700,
            fontSize: '14px',
            marginBottom: '16px',
          }}
        >
          Gastos por categoria
        </h2>
        {loading ? (
          <div
            className="skeleton"
            style={{ height: '160px', borderRadius: '10px' }}
          />
        ) : (
          <DonutChart data={stats?.categoryStats ?? []} />
        )}
      </div>

      {/* Monthly trend */}
      <div className="card" style={{ padding: '16px', marginBottom: '12px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '14px',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-syne)',
              fontWeight: 700,
              fontSize: '14px',
            }}
          >
            Tendencia
          </h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            {[
              { color: '#00D084', label: 'Ing' },
              { color: '#FF4D4D', label: 'Gas' },
            ].map(({ color, label }) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '2px',
                    background: color,
                    borderRadius: '2px',
                  }}
                />
                <span
                  style={{
                    fontSize: '10px',
                    color: 'var(--muted)',
                    fontFamily: 'var(--font-syne)',
                  }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
        {loading ? (
          <div
            className="skeleton"
            style={{ height: '180px', borderRadius: '10px' }}
          />
        ) : (
          <MonthlyLineChart data={stats?.monthlyStats ?? []} />
        )}
      </div>

      {/* Recent transactions */}
      <div className="card" style={{ padding: '16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-syne)',
              fontWeight: 700,
              fontSize: '14px',
            }}
          >
            Recientes
          </h2>
          <a
            href="/transactions"
            style={{
              fontSize: '12px',
              color: 'var(--accent)',
              fontFamily: 'var(--font-syne)',
              textDecoration: 'none',
            }}
          >
            Ver todas
          </a>
        </div>

        {loading ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="skeleton"
                style={{ height: '60px', borderRadius: '10px' }}
              />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '32px 16px',
              color: 'var(--muted)',
              fontFamily: 'var(--font-syne)',
              fontSize: '13px',
            }}
          >
            Sin transacciones este mes
          </div>
        ) : (
          <div>
            {recent.map((t) => (
              <TransactionRow
                key={t.id}
                transaction={t}
                onCategoryChange={handleCategoryChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
