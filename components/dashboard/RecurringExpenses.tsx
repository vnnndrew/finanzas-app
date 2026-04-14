'use client'

import { useEffect, useState } from 'react'
import { formatCLP } from '@/lib/utils'
import { CATEGORY_CONFIG } from '@/types'
import { Repeat } from 'lucide-react'
import type { RecurringExpense, Category } from '@/types'

export function RecurringExpenses() {
  const [recurring, setRecurring] = useState<RecurringExpense[]>([])
  const [totalFixed, setTotalFixed] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/recurring')
      .then(r => r.json())
      .then(d => {
        setRecurring(d.recurring ?? [])
        setTotalFixed(d.totalFixed ?? 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return null
  if (!recurring.length) return null

  return (
    <div className="card" style={{ padding: '16px', marginBottom: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Repeat size={14} color="var(--accent)" />
          <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '14px' }}>
            Gastos fijos
          </h2>
        </div>
        <span className="num" style={{ fontSize: '13px', color: 'var(--danger)' }}>
          ~{formatCLP(totalFixed)}/mes
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {recurring.slice(0, 6).map(item => {
          const config = CATEGORY_CONFIG[item.category as Category]
          return (
            <div
              key={item.merchant}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'var(--surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  flexShrink: 0,
                }}
              >
                {config?.icon ?? '📦'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: '13px',
                  fontFamily: 'var(--font-syne)',
                  fontWeight: 500,
                  color: 'var(--text)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {item.merchant}
                </p>
                <p style={{ fontSize: '10px', fontFamily: 'var(--font-syne)', color: 'var(--muted)' }}>
                  {item.months} meses consecutivos
                </p>
              </div>
              <span className="num" style={{ fontSize: '13px', color: '#FF4D4D', flexShrink: 0 }}>
                ~{formatCLP(item.avgAmount)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
