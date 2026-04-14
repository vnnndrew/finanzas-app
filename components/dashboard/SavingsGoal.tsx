'use client'

import { useEffect, useState } from 'react'
import { formatCLP } from '@/lib/utils'
import { Target, CheckCircle, AlertCircle } from 'lucide-react'

interface GoalData {
  goal: { id: string; amount: number; month: string } | null
  progress: {
    saved: number
    income: number
    expenses: number
    percentage: number
    onTrack: boolean
    expectedProgress: number
  }
}

export function SavingsGoal() {
  const [data, setData] = useState<GoalData | null>(null)
  const [editing, setEditing] = useState(false)
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchGoal()
  }, [])

  async function fetchGoal() {
    const res = await fetch('/api/savings-goal')
    const d = await res.json()
    setData(d)
    if (d.goal) setAmount(String(d.goal.amount))
  }

  async function handleSave() {
    const num = parseInt(amount)
    if (!num || num <= 0) return
    setSaving(true)
    await fetch('/api/savings-goal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: num }),
    })
    await fetchGoal()
    setSaving(false)
    setEditing(false)
  }

  if (!data) return null

  const hasGoal = !!data.goal
  const pct = Math.min(100, Math.max(0, data.progress.percentage))
  const isPositive = data.progress.saved > 0

  return (
    <div className="card" style={{ padding: '16px', marginBottom: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Target size={14} color="var(--accent)" />
          <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '14px' }}>
            Meta de ahorro
          </h2>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--accent)',
            fontFamily: 'var(--font-syne)',
            fontSize: '11px',
            cursor: 'pointer',
          }}
        >
          {hasGoal ? 'Editar' : 'Definir'}
        </button>
      </div>

      {editing ? (
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Ej: 200000"
            style={{
              flex: 1,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '10px 12px',
              color: 'var(--text)',
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '14px',
              outline: 'none',
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')}
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="press-scale"
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              background: 'var(--accent)',
              border: 'none',
              color: '#0A0A0A',
              fontFamily: 'var(--font-syne)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {saving ? '...' : 'OK'}
          </button>
        </div>
      ) : hasGoal ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
            <div>
              <p className="num" style={{
                fontSize: '22px',
                fontWeight: 500,
                color: isPositive ? 'var(--accent)' : 'var(--danger)',
              }}>
                {isPositive ? '+' : '-'}{formatCLP(data.progress.saved)}
              </p>
              <p style={{ fontSize: '11px', fontFamily: 'var(--font-syne)', color: 'var(--muted)', marginTop: '2px' }}>
                ahorrado este mes
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p className="num" style={{ fontSize: '14px', color: 'var(--muted)' }}>
                / {formatCLP(data.goal!.amount)}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{
            height: '8px',
            borderRadius: '4px',
            background: 'var(--surface)',
            marginBottom: '10px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${pct}%`,
              borderRadius: '4px',
              background: data.progress.onTrack
                ? 'var(--accent)'
                : '#FFB84D',
              transition: 'width 0.5s ease',
            }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {data.progress.onTrack ? (
              <CheckCircle size={13} color="var(--accent)" />
            ) : (
              <AlertCircle size={13} color="#FFB84D" />
            )}
            <span style={{
              fontSize: '11px',
              fontFamily: 'var(--font-syne)',
              color: data.progress.onTrack ? 'var(--accent)' : '#FFB84D',
            }}>
              {data.progress.onTrack
                ? 'Vas en buen camino'
                : 'Por debajo del ritmo esperado'}
            </span>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <p style={{ fontSize: '12px', fontFamily: 'var(--font-syne)', color: 'var(--muted)' }}>
            Define cuanto quieres ahorrar este mes
          </p>
        </div>
      )}
    </div>
  )
}
