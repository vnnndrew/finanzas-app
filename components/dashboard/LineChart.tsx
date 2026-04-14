'use client'

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { formatCLP } from '@/lib/utils'
import type { MonthlyStats } from '@/types'

interface LineChartProps {
  data: MonthlyStats[]
}

function shortMonth(m: string) {
  const [year, month] = m.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1, 1)
  return date.toLocaleDateString('es-CL', { month: 'short' }).replace('.', '')
}

export function MonthlyLineChart({ data }: LineChartProps) {
  if (!data.length) {
    return (
      <div
        style={{
          height: '160px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p
          style={{
            color: 'var(--muted)',
            fontFamily: 'var(--font-syne)',
            fontSize: '13px',
          }}
        >
          Sin datos
        </p>
      </div>
    )
  }

  const chartData = data.map((d) => ({
    ...d,
    label: shortMonth(d.month),
  }))

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart
        data={chartData}
        margin={{ top: 5, right: 5, bottom: 0, left: -20 }}
      >
        <defs>
          <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00D084" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#00D084" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradExpenses" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF4D4D" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#FF4D4D" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(255,255,255,0.04)"
          vertical={false}
        />
        <XAxis
          dataKey="label"
          tick={{ fill: '#777', fontSize: 10, fontFamily: 'var(--font-syne)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{
            fill: '#777',
            fontSize: 9,
            fontFamily: 'var(--font-dm-mono)',
          }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          width={42}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null
            return (
              <div
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  fontFamily: 'var(--font-syne)',
                }}
              >
                <p
                  style={{
                    fontSize: '10px',
                    color: 'var(--muted)',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  {label}
                </p>
                {payload.map((p) => (
                  <div
                    key={p.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '2px',
                    }}
                  >
                    <div
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: p.color,
                      }}
                    />
                    <span
                      style={{ fontSize: '11px', color: 'var(--muted)' }}
                    >
                      {p.name === 'income' ? 'Ingresos' : 'Gastos'}:
                    </span>
                    <span
                      className="num"
                      style={{ fontSize: '11px', color: 'var(--text)' }}
                    >
                      {formatCLP(p.value as number)}
                    </span>
                  </div>
                ))}
              </div>
            )
          }}
        />
        <Area
          type="monotone"
          dataKey="income"
          stroke="#00D084"
          strokeWidth={2}
          fill="url(#gradIncome)"
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="expenses"
          stroke="#FF4D4D"
          strokeWidth={2}
          fill="url(#gradExpenses)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
