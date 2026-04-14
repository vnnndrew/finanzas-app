'use client'

import { useEffect, useState } from 'react'
import { formatCLP } from '@/lib/utils'
import { CATEGORY_CONFIG } from '@/types'
import { PieChart } from 'lucide-react'
import type { BudgetWithSpent, Category } from '@/types'
import Link from 'next/link'

export function BudgetProgress() {
  const [budgets, setBudgets] = useState<BudgetWithSpent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/budgets')
      .then(r => r.json())
      .then(d => setBudgets(d.budgets ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return null

  return (
    <div className="card" style={{ padding: '16px', marginBottom: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PieChart size={14} color="var(--accent)" />
          <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '14px' }}>
            Presupuestos
          </h2>
        </div>
        <Link
          href="/budgets"
          style={{
            fontSize: '11px',
            color: 'var(--accent)',
            fontFamily: 'var(--font-syne)',
            textDecoration: 'none',
          }}
        >
          {budgets.length ? 'Editar' : 'Configurar'}
        </Link>
      </div>

      {!budgets.length ? (
        <Link
          href="/budgets"
          className="press-scale"
          style={{
            display: 'block',
            textAlign: 'center',
            padding: '16px',
            borderRadius: '10px',
            background: 'var(--surface)',
            border: '1px dashed var(--border)',
            textDecoration: 'none',
          }}
        >
          <p style={{ fontSize: '12px', fontFamily: 'var(--font-syne)', color: 'var(--muted)', lineHeight: 1.4 }}>
            Define limites mensuales por categoria
          </p>
        </Link>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {budgets.map(b => {
            const config = CATEGORY_CONFIG[b.category as Category]
            const pct = Math.min(100, b.percentage)
            const isOver = b.percentage >= 100
            const isWarning = b.percentage >= 80

            return (
              <div key={b.category}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px' }}>{config?.icon}</span>
                    <span style={{ fontSize: '12px', fontFamily: 'var(--font-syne)', color: 'var(--text)' }}>
                      {config?.label ?? b.category}
                    </span>
                  </div>
                  <span className="num" style={{
                    fontSize: '11px',
                    color: isOver ? '#FF4D4D' : isWarning ? '#FFB84D' : 'var(--muted)',
                  }}>
                    {formatCLP(b.spent)} / {formatCLP(b.amount)}
                  </span>
                </div>
                <div style={{
                  height: '6px',
                  borderRadius: '3px',
                  background: 'var(--surface)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${pct}%`,
                    borderRadius: '3px',
                    background: isOver
                      ? '#FF4D4D'
                      : isWarning
                        ? '#FFB84D'
                        : config?.color ?? 'var(--accent)',
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
