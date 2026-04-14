'use client'

import { useState } from 'react'
import { formatCLP, formatShortDate } from '@/lib/utils'
import { CategoryBadge } from './CategoryBadge'
import { CATEGORY_CONFIG } from '@/types'
import type { Transaction, Category } from '@/types'

interface TransactionRowProps {
  transaction: Transaction
  onCategoryChange?: (id: string, category: Category) => void
}

export function TransactionRow({
  transaction: t,
  onCategoryChange,
}: TransactionRowProps) {
  const [editing, setEditing] = useState(false)
  const isExpense = t.amount < 0

  return (
    <div
      className="press-scale"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 0',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Category icon */}
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontSize: '16px',
        }}
      >
        {CATEGORY_CONFIG[t.category]?.icon ?? '📦'}
      </div>

      {/* Middle: merchant + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: '14px',
            fontFamily: 'var(--font-syne)',
            fontWeight: 500,
            color: 'var(--text)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.3,
          }}
        >
          {t.merchant || t.description_raw}
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '3px',
          }}
        >
          <span
            style={{
              fontSize: '11px',
              fontFamily: 'var(--font-dm-mono)',
              color: 'var(--muted)',
            }}
          >
            {formatShortDate(t.date)}
          </span>
          <span style={{ color: 'var(--border)', fontSize: '8px' }}>●</span>
          {editing ? (
            <select
              defaultValue={t.category}
              onChange={(e) => {
                onCategoryChange?.(t.id, e.target.value as Category)
                setEditing(false)
              }}
              onBlur={() => setEditing(false)}
              autoFocus
              style={{
                background: 'var(--card)',
                border: '1px solid var(--accent)',
                borderRadius: '6px',
                color: 'var(--text)',
                fontFamily: 'var(--font-syne)',
                fontSize: '11px',
                padding: '2px 4px',
                outline: 'none',
              }}
            >
              {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>
                  {cfg.icon} {cfg.label}
                </option>
              ))}
            </select>
          ) : (
            <button
              onClick={() => setEditing(true)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <CategoryBadge category={t.category} />
            </button>
          )}
        </div>
      </div>

      {/* Amount — right aligned */}
      <span
        className="num"
        style={{
          fontSize: '15px',
          fontWeight: 500,
          color: isExpense ? '#FF4D4D' : '#00D084',
          flexShrink: 0,
          textAlign: 'right',
        }}
      >
        {isExpense ? '-' : '+'}
        {formatCLP(t.amount)}
      </span>
    </div>
  )
}
