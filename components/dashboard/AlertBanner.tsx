'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, TrendingUp, ShieldAlert } from 'lucide-react'
import { formatCLP } from '@/lib/utils'
import type { SpendingAlert } from '@/types'

const ICON_MAP = {
  unusual_day: AlertTriangle,
  budget_warning: TrendingUp,
  budget_exceeded: ShieldAlert,
}

const COLOR_MAP = {
  unusual_day: { bg: 'rgba(255,184,77,0.08)', border: 'rgba(255,184,77,0.2)', text: '#FFB84D' },
  budget_warning: { bg: 'rgba(255,184,77,0.08)', border: 'rgba(255,184,77,0.2)', text: '#FFB84D' },
  budget_exceeded: { bg: 'rgba(255,77,77,0.08)', border: 'rgba(255,77,77,0.2)', text: '#FF4D4D' },
}

export function AlertBanner() {
  const [alerts, setAlerts] = useState<SpendingAlert[]>([])

  useEffect(() => {
    fetch('/api/alerts')
      .then(r => r.json())
      .then(d => setAlerts(d.alerts ?? []))
      .catch(() => {})
  }, [])

  if (!alerts.length) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
      {alerts.slice(0, 3).map((alert, i) => {
        const Icon = ICON_MAP[alert.type]
        const colors = COLOR_MAP[alert.type]
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '12px',
              background: colors.bg,
              border: `1px solid ${colors.border}`,
            }}
          >
            <Icon size={16} color={colors.text} style={{ flexShrink: 0 }} />
            <span
              style={{
                flex: 1,
                fontFamily: 'var(--font-syne)',
                fontSize: '12px',
                color: colors.text,
                lineHeight: 1.4,
              }}
            >
              {alert.message}
            </span>
            {alert.amount && (
              <span
                className="num"
                style={{ fontSize: '12px', color: colors.text, flexShrink: 0 }}
              >
                {formatCLP(alert.amount)}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
