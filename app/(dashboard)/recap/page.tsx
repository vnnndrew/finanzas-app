'use client'

import { useEffect, useState } from 'react'
import { formatCLP } from '@/lib/utils'
import { CATEGORY_CONFIG } from '@/types'
import type { Category } from '@/types'
import { TrendingUp, TrendingDown, ArrowUp, ArrowDown, Minus } from 'lucide-react'

interface RecapData {
  current: { income: number; expenses: number; balance: number }
  previous: { income: number; expenses: number; balance: number }
  diff: { income: number; expenses: number; balance: number }
  topCategory: { category: Category; total: number; diff: number } | null
  savedMore: boolean
  currentCategories: Record<string, number>
  previousCategories: Record<string, number>
}

export default function RecapPage() {
  const [data, setData] = useState<RecapData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/recap')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const now = new Date()
  const currentMonth = now.toLocaleDateString('es-CL', { month: 'long' })
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    .toLocaleDateString('es-CL', { month: 'long' })

  function DiffBadge({ value }: { value: number }) {
    if (value === 0) return <Minus size={10} color="var(--muted)" />
    const isUp = value > 0
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        fontSize: '11px',
        fontFamily: 'var(--font-dm-mono)',
        color: isUp ? '#FF4D4D' : '#00D084',
      }}>
        {isUp ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
        {formatCLP(Math.abs(value))}
      </span>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h1
          style={{
            fontFamily: 'var(--font-syne)',
            fontWeight: 800,
            fontSize: '24px',
            letterSpacing: '-0.02em',
            marginBottom: '2px',
          }}
        >
          Resumen mensual
        </h1>
        <p
          style={{
            color: 'var(--muted)',
            fontFamily: 'var(--font-syne)',
            fontSize: '13px',
            textTransform: 'capitalize',
          }}
        >
          {currentMonth} vs {prevMonth}
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[0, 1, 2].map(i => (
            <div key={i} className="skeleton" style={{ height: '80px', borderRadius: '14px' }} />
          ))}
        </div>
      ) : !data ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)', fontFamily: 'var(--font-syne)', fontSize: '13px' }}>
          No hay datos suficientes
        </div>
      ) : (
        <div className="stagger">
          {/* Summary verdict */}
          <div
            className="card"
            style={{
              padding: '20px 16px',
              marginBottom: '12px',
              textAlign: 'center',
              background: data.savedMore
                ? 'rgba(0,208,132,0.06)'
                : 'rgba(255,77,77,0.06)',
              borderColor: data.savedMore
                ? 'rgba(0,208,132,0.15)'
                : 'rgba(255,77,77,0.15)',
            }}
          >
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>
              {data.savedMore ? '🎉' : '📉'}
            </div>
            <p style={{
              fontFamily: 'var(--font-syne)',
              fontWeight: 700,
              fontSize: '16px',
              color: data.savedMore ? 'var(--accent)' : 'var(--danger)',
              marginBottom: '4px',
            }}>
              {data.savedMore
                ? 'Mejoraste tu ahorro'
                : 'Gastaste mas que el mes anterior'}
            </p>
            <p style={{ fontSize: '12px', fontFamily: 'var(--font-syne)', color: 'var(--muted)' }}>
              Balance: {data.diff.balance >= 0 ? '+' : '-'}{formatCLP(Math.abs(data.diff.balance))} vs {prevMonth}
            </p>
          </div>

          {/* Income vs Expenses comparison */}
          {[
            {
              label: 'Ingresos',
              icon: TrendingUp,
              current: data.current.income,
              previous: data.previous.income,
              diff: data.diff.income,
              color: '#00D084',
              diffInverted: false,
            },
            {
              label: 'Gastos',
              icon: TrendingDown,
              current: data.current.expenses,
              previous: data.previous.expenses,
              diff: data.diff.expenses,
              color: '#FF4D4D',
              diffInverted: true,
            },
          ].map(row => (
            <div
              key={row.label}
              className="card"
              style={{ padding: '16px', marginBottom: '10px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <row.icon size={14} color={row.color} />
                <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: '13px' }}>
                  {row.label}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <p style={{ fontSize: '10px', fontFamily: 'var(--font-syne)', color: 'var(--muted)', textTransform: 'capitalize', marginBottom: '2px' }}>
                    {currentMonth}
                  </p>
                  <p className="num" style={{ fontSize: '20px', fontWeight: 500, color: 'var(--text)' }}>
                    {formatCLP(row.current)}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '10px', fontFamily: 'var(--font-syne)', color: 'var(--muted)', textTransform: 'capitalize', marginBottom: '2px' }}>
                    {prevMonth}
                  </p>
                  <p className="num" style={{ fontSize: '14px', color: 'var(--muted)' }}>
                    {formatCLP(row.previous)}
                  </p>
                </div>
                <DiffBadge value={row.diffInverted ? row.diff : -row.diff} />
              </div>
            </div>
          ))}

          {/* Top category that grew most */}
          {data.topCategory && (
            <div className="card" style={{ padding: '16px', marginBottom: '10px' }}>
              <p style={{ fontSize: '11px', fontFamily: 'var(--font-syne)', color: 'var(--muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Categoria que mas crecio
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>
                  {CATEGORY_CONFIG[data.topCategory.category]?.icon}
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: '14px' }}>
                    {CATEGORY_CONFIG[data.topCategory.category]?.label}
                  </p>
                  <p className="num" style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '1px' }}>
                    {formatCLP(data.topCategory.total)} este mes
                  </p>
                </div>
                <span className="num" style={{ fontSize: '13px', color: '#FF4D4D' }}>
                  +{formatCLP(data.topCategory.diff)}
                </span>
              </div>
            </div>
          )}

          {/* Category breakdown */}
          <div className="card" style={{ padding: '16px' }}>
            <p style={{ fontSize: '11px', fontFamily: 'var(--font-syne)', color: 'var(--muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Detalle por categoria
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {Object.entries(data.currentCategories)
                .sort(([, a], [, b]) => b - a)
                .map(([cat, total]) => {
                  const config = CATEGORY_CONFIG[cat as Category]
                  const prev = data.previousCategories[cat] ?? 0
                  const diff = total - prev
                  return (
                    <div
                      key={cat}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 0',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      <span style={{ fontSize: '14px', width: '20px', textAlign: 'center' }}>
                        {config?.icon}
                      </span>
                      <span style={{ flex: 1, fontSize: '12px', fontFamily: 'var(--font-syne)', color: 'var(--text)' }}>
                        {config?.label ?? cat}
                      </span>
                      <span className="num" style={{ fontSize: '12px', color: 'var(--text)' }}>
                        {formatCLP(total)}
                      </span>
                      {diff !== 0 && (
                        <span className="num" style={{
                          fontSize: '10px',
                          color: diff > 0 ? '#FF4D4D' : '#00D084',
                          minWidth: '50px',
                          textAlign: 'right',
                        }}>
                          {diff > 0 ? '+' : '-'}{formatCLP(Math.abs(diff))}
                        </span>
                      )}
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
