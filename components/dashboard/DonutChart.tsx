'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCLP } from '@/lib/utils'
import { CATEGORY_CONFIG } from '@/types'
import type { CategoryStats } from '@/types'

interface DonutChartProps {
  data: CategoryStats[]
}

export function DonutChart({ data }: DonutChartProps) {
  if (!data.length) {
    return (
      <div
        style={{
          height: '180px',
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

  const top5 = data.slice(0, 5)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
      }}
    >
      {/* Chart */}
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie
            data={top5}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={72}
            paddingAngle={3}
            dataKey="total"
          >
            {top5.map((entry) => (
              <Cell
                key={entry.category}
                fill={CATEGORY_CONFIG[entry.category]?.color ?? '#475569'}
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null
              const d = payload[0].payload as CategoryStats
              return (
                <div
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    fontFamily: 'var(--font-syne)',
                  }}
                >
                  <p style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    {CATEGORY_CONFIG[d.category]?.icon}{' '}
                    {CATEGORY_CONFIG[d.category]?.label}
                  </p>
                  <p
                    className="num"
                    style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'var(--text)',
                      marginTop: '2px',
                    }}
                  >
                    {formatCLP(d.total)}
                  </p>
                </div>
              )
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend — horizontal wrap on mobile */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        {top5.map((item) => (
          <div
            key={item.category}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              borderRadius: '20px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background:
                  CATEGORY_CONFIG[item.category]?.color ?? '#475569',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-syne)',
                color: 'var(--muted)',
                whiteSpace: 'nowrap',
              }}
            >
              {CATEGORY_CONFIG[item.category]?.label}
            </span>
            <span
              className="num"
              style={{
                fontSize: '11px',
                color: 'var(--text)',
                fontWeight: 500,
              }}
            >
              {item.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
