'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { TransactionRow } from '@/components/transactions/TransactionRow'
import { CATEGORY_CONFIG } from '@/types'
import type { Transaction, Category } from '@/types'

const CATEGORIES = ['todas', ...Object.keys(CATEGORY_CONFIG)] as const

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<string>('todas')
  const [offset, setOffset] = useState(0)
  const LIMIT = 30
  const scrollRef = useRef<HTMLDivElement>(null)

  const fetch_ = useCallback(async (cat: string, off: number) => {
    setLoading(true)
    const params = new URLSearchParams({
      limit: String(LIMIT),
      offset: String(off),
    })
    if (cat !== 'todas') params.set('category', cat)
    const res = await fetch(`/api/transactions?${params}`)
    const data = await res.json()
    setTransactions(data.transactions ?? [])
    setTotal(data.total ?? 0)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetch_(category, offset)
  }, [category, offset, fetch_])

  async function handleCategoryChange(id: string, cat: Category) {
    await fetch('/api/transactions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, category: cat }),
    })
    fetch_(category, offset)
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <h1
          style={{
            fontFamily: 'var(--font-syne)',
            fontWeight: 800,
            fontSize: '24px',
            letterSpacing: '-0.02em',
            marginBottom: '2px',
          }}
        >
          Movimientos
        </h1>
        <p
          style={{
            color: 'var(--muted)',
            fontFamily: 'var(--font-syne)',
            fontSize: '13px',
          }}
        >
          {total} transacciones
        </p>
      </div>

      {/* Horizontal scrollable filter pills */}
      <div
        ref={scrollRef}
        className="no-scrollbar"
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          marginLeft: 'calc(-1 * var(--page-px))',
          marginRight: 'calc(-1 * var(--page-px))',
          paddingLeft: 'var(--page-px)',
          paddingRight: 'var(--page-px)',
          paddingBottom: '4px',
          marginBottom: '16px',
        }}
      >
        {CATEGORIES.map((cat) => {
          const active = category === cat
          const config =
            cat !== 'todas' ? CATEGORY_CONFIG[cat as Category] : null
          return (
            <button
              key={cat}
              onClick={() => {
                setCategory(cat)
                setOffset(0)
              }}
              className="press-scale"
              style={{
                padding: '7px 14px',
                borderRadius: '20px',
                border: active
                  ? `1px solid ${config?.color ?? 'var(--accent)'}40`
                  : '1px solid var(--border)',
                background: active
                  ? (config?.color ?? 'var(--accent)') + '15'
                  : 'var(--card)',
                color: active
                  ? (config?.color ?? 'var(--accent)')
                  : 'var(--muted)',
                fontFamily: 'var(--font-syne)',
                fontSize: '12px',
                fontWeight: active ? 600 : 400,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {config && (
                <span style={{ fontSize: '12px' }}>{config.icon}</span>
              )}
              {cat === 'todas' ? 'Todas' : config?.label}
            </button>
          )
        })}
      </div>

      {/* Transaction list */}
      <div className="card" style={{ padding: '4px 16px' }}>
        {loading ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              padding: '8px 0',
            }}
          >
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="skeleton"
                style={{ height: '60px', borderRadius: '10px' }}
              />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 16px',
              color: 'var(--muted)',
              fontFamily: 'var(--font-syne)',
              fontSize: '13px',
            }}
          >
            Sin transacciones en esta categoria
          </div>
        ) : (
          <div>
            {transactions.map((t) => (
              <TransactionRow
                key={t.id}
                transaction={t}
                onCategoryChange={handleCategoryChange}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > LIMIT && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '12px',
            marginTop: '16px',
          }}
        >
          <button
            onClick={() => setOffset(Math.max(0, offset - LIMIT))}
            disabled={offset === 0}
            className="press-scale"
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              color: offset === 0 ? '#444' : 'var(--text)',
              fontFamily: 'var(--font-syne)',
              fontSize: '13px',
              cursor: offset === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            Anterior
          </button>
          <span
            className="num"
            style={{
              fontSize: '12px',
              color: 'var(--muted)',
            }}
          >
            {Math.floor(offset / LIMIT) + 1}/{Math.ceil(total / LIMIT)}
          </span>
          <button
            onClick={() => setOffset(offset + LIMIT)}
            disabled={offset + LIMIT >= total}
            className="press-scale"
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              color: offset + LIMIT >= total ? '#444' : 'var(--text)',
              fontFamily: 'var(--font-syne)',
              fontSize: '13px',
              cursor: offset + LIMIT >= total ? 'not-allowed' : 'pointer',
            }}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  )
}
