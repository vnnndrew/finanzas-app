'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { formatCLP } from '@/lib/utils'
import { RefreshCw, Plug, CheckCircle, AlertCircle } from 'lucide-react'

declare global {
  interface Window {
    Fintoc?: {
      create: (config: object) => { open: () => void }
    }
  }
}

interface Account {
  id: string
  bank_name: string
  account_number_last4: string
  account_type: string
  currency: string
  balance: number
  created_at: string
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const [account, setAccount] = useState<Account | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [msg, setMsg] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const widgetRef = useRef<{ open: () => void } | null>(null)

  useEffect(() => {
    fetchAccount()
    if (document.querySelector('script[src="https://js.fintoc.com/v1/"]')) return
    const script = document.createElement('script')
    script.src = 'https://js.fintoc.com/v1/'
    document.head.appendChild(script)
  }, [])

  async function fetchAccount() {
    setLoading(true)
    const res = await fetch('/api/fintoc/account')
    if (res.ok) {
      const data = await res.json()
      setAccount(data.account)
    }
    setLoading(false)
  }

  function openFintocWidget() {
    if (!window.Fintoc) {
      setMsg({
        type: 'error',
        text: 'Widget de Fintoc no cargado. Recarga la pagina.',
      })
      return
    }

    if (!widgetRef.current) {
      widgetRef.current = window.Fintoc.create({
        publicKey: process.env.NEXT_PUBLIC_FINTOC_PUBLIC_KEY,
        product: 'movements',
        country: 'cl',
        onSuccess: async (token: string) => {
        setMsg(null)
        const res = await fetch('/api/fintoc/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ link_token: token }),
        })
        if (res.ok) {
          setMsg({ type: 'success', text: 'Banco conectado' })
          fetchAccount()
          handleSync()
        } else {
          const data = await res.json()
          setMsg({ type: 'error', text: data.error ?? 'Error al conectar' })
        }
      },
      onExit: () => {},
      })
    }
    widgetRef.current.open()
  }

  async function handleSync() {
    setSyncing(true)
    setMsg(null)
    const res = await fetch('/api/fintoc/sync', { method: 'POST' })
    const data = await res.json()
    if (res.ok) {
      setMsg({ type: 'success', text: data.message })
      fetchAccount()
    } else {
      setMsg({ type: 'error', text: data.error ?? 'Error al sincronizar' })
    }
    setSyncing(false)
  }

  return (
    <div>
      {/* Header */}
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
          Ajustes
        </h1>
        <p
          style={{
            color: 'var(--muted)',
            fontFamily: 'var(--font-syne)',
            fontSize: '13px',
          }}
        >
          Cuenta y banco
        </p>
      </div>

      {/* Alert message */}
      {msg && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
            padding: '12px 14px',
            borderRadius: '12px',
            background:
              msg.type === 'success'
                ? 'rgba(0,208,132,0.08)'
                : 'rgba(255,77,77,0.08)',
            border: `1px solid ${msg.type === 'success' ? 'rgba(0,208,132,0.2)' : 'rgba(255,77,77,0.2)'}`,
            color: msg.type === 'success' ? 'var(--accent)' : 'var(--danger)',
            fontFamily: 'var(--font-syne)',
            fontSize: '13px',
          }}
        >
          {msg.type === 'success' ? (
            <CheckCircle size={15} />
          ) : (
            <AlertCircle size={15} />
          )}
          {msg.text}
        </div>
      )}

      {/* Bank account section */}
      <div className="card" style={{ padding: '16px', marginBottom: '12px' }}>
        <h2
          style={{
            fontFamily: 'var(--font-syne)',
            fontWeight: 700,
            fontSize: '14px',
            marginBottom: '16px',
          }}
        >
          Cuenta bancaria
        </h2>

        {loading ? (
          <div
            className="skeleton"
            style={{ height: '80px', borderRadius: '10px' }}
          />
        ) : account ? (
          <div>
            {/* Bank card */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px',
                borderRadius: '12px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                marginBottom: '14px',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'var(--accent-dim)',
                  border: '1px solid rgba(0,208,132,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  flexShrink: 0,
                }}
              >
                🏦
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontFamily: 'var(--font-syne)',
                    fontWeight: 600,
                    fontSize: '14px',
                    marginBottom: '2px',
                  }}
                >
                  {account.bank_name}
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-syne)',
                    fontSize: '11px',
                    color: 'var(--muted)',
                  }}
                >
                  {account.account_type} ···· {account.account_number_last4}
                </p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p
                  style={{
                    fontSize: '10px',
                    color: 'var(--muted)',
                    fontFamily: 'var(--font-syne)',
                    marginBottom: '2px',
                  }}
                >
                  Saldo
                </p>
                <p
                  className="num"
                  style={{
                    fontSize: '16px',
                    fontWeight: 500,
                    color: 'var(--accent)',
                  }}
                >
                  {formatCLP(account.balance)}
                </p>
              </div>
            </div>

            {/* Action buttons — stacked on mobile */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <button
                onClick={handleSync}
                disabled={syncing}
                className="press-scale"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '7px',
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'var(--accent-dim)',
                  border: '1px solid rgba(0,208,132,0.15)',
                  color: 'var(--accent)',
                  fontFamily: 'var(--font-syne)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: syncing ? 'not-allowed' : 'pointer',
                  width: '100%',
                }}
              >
                <RefreshCw
                  size={14}
                  style={{
                    animation: syncing ? 'spin 1s linear infinite' : 'none',
                  }}
                />
                {syncing ? 'Sincronizando...' : 'Sincronizar ahora'}
              </button>

              <button
                onClick={openFintocWidget}
                className="press-scale"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '7px',
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--muted)',
                  fontFamily: 'var(--font-syne)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                <Plug size={14} />
                Reconectar banco
              </button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px 8px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
                fontSize: '24px',
              }}
            >
              🏦
            </div>
            <p
              style={{
                fontFamily: 'var(--font-syne)',
                fontWeight: 600,
                fontSize: '15px',
                marginBottom: '4px',
              }}
            >
              No hay banco conectado
            </p>
            <p
              style={{
                color: 'var(--muted)',
                fontFamily: 'var(--font-syne)',
                fontSize: '12px',
                marginBottom: '18px',
                lineHeight: 1.4,
              }}
            >
              Conecta tu banco para importar transacciones
            </p>
            <button
              onClick={openFintocWidget}
              className="press-scale"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                borderRadius: '10px',
                background: 'var(--accent)',
                border: 'none',
                color: '#0A0A0A',
                fontFamily: 'var(--font-syne)',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Plug size={15} />
              Conectar banco
            </button>
          </div>
        )}
      </div>

      {/* User info */}
      <div className="card" style={{ padding: '16px' }}>
        <h2
          style={{
            fontFamily: 'var(--font-syne)',
            fontWeight: 700,
            fontSize: '14px',
            marginBottom: '12px',
          }}
        >
          Tu cuenta
        </h2>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {[
            { label: 'Email', value: session?.user?.email },
            { label: 'Nombre', value: session?.user?.name ?? '—' },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                borderRadius: '10px',
                background: 'var(--surface)',
              }}
            >
              <span
                style={{
                  fontSize: '12px',
                  color: 'var(--muted)',
                  fontFamily: 'var(--font-syne)',
                }}
              >
                {label}
              </span>
              <span
                style={{
                  fontSize: '13px',
                  fontFamily: 'var(--font-syne)',
                  color: 'var(--text)',
                }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
