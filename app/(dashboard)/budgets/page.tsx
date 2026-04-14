'use client'

import { useEffect, useState } from 'react'
import { formatCLP } from '@/lib/utils'
import { CATEGORY_CONFIG } from '@/types'
import type { BudgetWithSpent, Category } from '@/types'
import { Plus, Trash2 } from 'lucide-react'

const ALL_CATEGORIES = Object.keys(CATEGORY_CONFIG) as Category[]

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<BudgetWithSpent[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [newCat, setNewCat] = useState<string>('')
  const [newAmount, setNewAmount] = useState('')
  const [saving, setSaving] = useState(false)

  async function fetchBudgets() {
    setLoading(true)
    const res = await fetch('/api/budgets')
    const d = await res.json()
    setBudgets(d.budgets ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchBudgets()
  }, [])

  async function handleAdd() {
    if (!newCat || !newAmount) return
    setSaving(true)
    await fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: newCat, amount: parseInt(newAmount) }),
    })
    await fetchBudgets()
    setSaving(false)
    setAdding(false)
    setNewCat('')
    setNewAmount('')
  }

  async function handleDelete(category: string) {
    await fetch('/api/budgets', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category }),
    })
    fetchBudgets()
  }

  const usedCategories = new Set(budgets.map(b => b.category))
  const availableCategories = ALL_CATEGORIES.filter(c => !usedCategories.has(c))

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
          Presupuestos
        </h1>
        <p
          style={{
            color: 'var(--muted)',
            fontFamily: 'var(--font-syne)',
            fontSize: '13px',
          }}
        >
          Limites mensuales por categoria
        </p>
      </div>

      {/* Budgets list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[0, 1, 2].map(i => (
            <div key={i} className="skeleton" style={{ height: '90px', borderRadius: '14px' }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {budgets.map(b => {
            const config = CATEGORY_CONFIG[b.category as Category]
            const pct = Math.min(100, b.percentage)
            const isOver = b.percentage >= 100
            const isWarning = b.percentage >= 80

            return (
              <div key={b.category} className="card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>{config?.icon}</span>
                    <span style={{ fontSize: '14px', fontFamily: 'var(--font-syne)', fontWeight: 600, color: 'var(--text)' }}>
                      {config?.label ?? b.category}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(b.category)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                  >
                    <Trash2 size={14} color="var(--muted)" />
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                  <span className="num" style={{
                    fontSize: '20px',
                    fontWeight: 500,
                    color: isOver ? '#FF4D4D' : isWarning ? '#FFB84D' : 'var(--text)',
                  }}>
                    {formatCLP(b.spent)}
                  </span>
                  <span className="num" style={{ fontSize: '13px', color: 'var(--muted)' }}>
                    de {formatCLP(b.amount)}
                  </span>
                </div>

                <div style={{
                  height: '8px',
                  borderRadius: '4px',
                  background: 'var(--surface)',
                  overflow: 'hidden',
                  marginBottom: '6px',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${pct}%`,
                    borderRadius: '4px',
                    background: isOver
                      ? '#FF4D4D'
                      : isWarning
                        ? '#FFB84D'
                        : config?.color ?? 'var(--accent)',
                    transition: 'width 0.5s ease',
                  }} />
                </div>

                <span style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-syne)',
                  color: isOver ? '#FF4D4D' : isWarning ? '#FFB84D' : 'var(--muted)',
                }}>
                  {b.percentage}% usado
                  {isOver && ' — Superaste el limite'}
                  {!isOver && isWarning && ' — Casi al limite'}
                </span>
              </div>
            )
          })}

          {/* Add budget */}
          {adding ? (
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <select
                  value={newCat}
                  onChange={e => setNewCat(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '12px',
                    color: 'var(--text)',
                    fontFamily: 'var(--font-syne)',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                >
                  <option value="">Selecciona categoria</option>
                  {availableCategories.map(cat => (
                    <option key={cat} value={cat}>
                      {CATEGORY_CONFIG[cat].icon} {CATEGORY_CONFIG[cat].label}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  value={newAmount}
                  onChange={e => setNewAmount(e.target.value)}
                  placeholder="Monto limite (ej: 80000)"
                  style={{
                    width: '100%',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '12px',
                    color: 'var(--text)',
                    fontFamily: 'var(--font-dm-mono)',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                />

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setAdding(false)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '10px',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--muted)',
                      fontFamily: 'var(--font-syne)',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAdd}
                    disabled={saving || !newCat || !newAmount}
                    className="press-scale"
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '10px',
                      background: 'var(--accent)',
                      border: 'none',
                      color: '#0A0A0A',
                      fontFamily: 'var(--font-syne)',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            </div>
          ) : availableCategories.length > 0 ? (
            <button
              onClick={() => setAdding(true)}
              className="press-scale"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '14px',
                borderRadius: '14px',
                background: 'transparent',
                border: '1px dashed var(--border)',
                color: 'var(--muted)',
                fontFamily: 'var(--font-syne)',
                fontSize: '13px',
                cursor: 'pointer',
                width: '100%',
              }}
            >
              <Plus size={16} />
              Agregar presupuesto
            </button>
          ) : null}
        </div>
      )}
    </div>
  )
}
