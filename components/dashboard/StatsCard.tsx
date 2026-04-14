'use client'

import { formatCLP } from '@/lib/utils'
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'

interface StatsCardProps {
  type: 'income' | 'expenses' | 'balance'
  amount: number
  label: string
}

const CONFIG = {
  income: { icon: TrendingUp, color: '#00D084', bg: 'rgba(0,208,132,0.08)' },
  expenses: { icon: TrendingDown, color: '#FF4D4D', bg: 'rgba(255,77,77,0.08)' },
  balance: { icon: Wallet, color: '#4D9EFF', bg: 'rgba(77,158,255,0.08)' },
}

export function StatsCard({ type, amount, label }: StatsCardProps) {
  const { icon: Icon, color, bg } = CONFIG[type]
  const isNegative = amount < 0

  return (
    <div
      className="card press-scale"
      style={{
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={18} color={color} strokeWidth={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: '11px',
            fontFamily: 'var(--font-syne)',
            color: 'var(--muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '2px',
          }}
        >
          {label}
        </p>
        <p
          className="num"
          style={{
            fontSize: '20px',
            fontWeight: 500,
            color:
              type === 'expenses'
                ? '#FF4D4D'
                : type === 'balance' && isNegative
                  ? '#FF4D4D'
                  : 'var(--text)',
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
          }}
        >
          {type === 'expenses' ? '-' : ''}
          {formatCLP(amount)}
        </p>
      </div>
    </div>
  )
}
