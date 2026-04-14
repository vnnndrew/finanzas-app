'use client'

import { useEffect, useState } from 'react'
import { formatCLP } from '@/lib/utils'
import { TrendingUp } from 'lucide-react'
import type { Projection } from '@/types'

export function ProjectionCard() {
  const [data, setData] = useState<Projection | null>(null)

  useEffect(() => {
    fetch('/api/projection')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
  }, [])

  if (!data || data.daysPassed < 3) return null

  const progressPct = Math.min(100, Math.round((data.daysPassed / (data.daysPassed + data.daysLeft)) * 100))

  return (
    <div className="card" style={{ padding: '16px', marginBottom: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <TrendingUp size={14} color="var(--accent)" />
        <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '14px' }}>
          Proyeccion del mes
        </h2>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div>
          <p style={{ fontSize: '10px', fontFamily: 'var(--font-syne)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
            Gasto actual
          </p>
          <p className="num" style={{ fontSize: '18px', fontWeight: 500, color: 'var(--text)' }}>
            {formatCLP(data.currentSpent)}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '10px', fontFamily: 'var(--font-syne)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
            Proyectado
          </p>
          <p className="num" style={{ fontSize: '18px', fontWeight: 500, color: '#FFB84D' }}>
            {formatCLP(data.projected)}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        height: '6px',
        borderRadius: '3px',
        background: 'var(--surface)',
        marginBottom: '10px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${progressPct}%`,
          borderRadius: '3px',
          background: 'linear-gradient(90deg, var(--accent), #FFB84D)',
          transition: 'width 0.5s ease',
        }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '11px', fontFamily: 'var(--font-syne)', color: 'var(--muted)' }}>
          {data.daysPassed} dias transcurridos
        </span>
        <span style={{ fontSize: '11px', fontFamily: 'var(--font-syne)', color: 'var(--muted)' }}>
          {data.daysLeft} dias restantes
        </span>
      </div>

      <div style={{
        marginTop: '10px',
        padding: '8px 10px',
        borderRadius: '8px',
        background: 'var(--surface)',
      }}>
        <span style={{ fontSize: '11px', fontFamily: 'var(--font-syne)', color: 'var(--muted)' }}>
          Promedio diario:{' '}
        </span>
        <span className="num" style={{ fontSize: '12px', color: 'var(--text)' }}>
          {formatCLP(data.dailyAvg)}
        </span>
      </div>
    </div>
  )
}
