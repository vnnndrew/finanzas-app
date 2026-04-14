'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (res?.error) {
      setError('Email o contrasena incorrectos')
      setLoading(false)
    } else {
      router.push('/')
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    padding: '13px 14px',
    color: 'var(--text)',
    fontSize: '15px',
    fontFamily: 'var(--font-syne)',
    outline: 'none',
    transition: 'border-color 0.2s',
  }

  return (
    <div
      className="flex flex-col justify-center px-6"
      style={{
        background: 'var(--bg)',
        minHeight: '100dvh',
        paddingTop: 'calc(var(--safe-top) + 40px)',
        paddingBottom: 'calc(var(--safe-bottom) + 40px)',
      }}
    >
      {/* Subtle grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,208,132,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,208,132,0.025) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="w-full max-w-sm mx-auto relative">
        {/* Logo */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--accent)' }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-dm-mono)',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#0A0A0A',
                }}
              >
                $
              </span>
            </div>
            <span
              style={{
                fontFamily: 'var(--font-syne)',
                fontWeight: 700,
                fontSize: '20px',
                color: 'var(--text)',
              }}
            >
              finanzas
            </span>
          </div>
          <p
            style={{
              color: 'var(--muted)',
              fontSize: '13px',
              fontFamily: 'var(--font-syne)',
            }}
          >
            Control de gastos · Chile
          </p>
        </div>

        {/* Form */}
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-syne)',
              fontWeight: 700,
              fontSize: '24px',
              marginBottom: '6px',
            }}
          >
            Bienvenido
          </h1>
          <p
            style={{
              color: 'var(--muted)',
              fontSize: '13px',
              marginBottom: '28px',
              fontFamily: 'var(--font-syne)',
            }}
          >
            Ingresa a tu cuenta
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontFamily: 'var(--font-syne)',
                  color: 'var(--muted)',
                  marginBottom: '7px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
                style={inputStyle}
                onFocus={(e) =>
                  (e.target.style.borderColor = 'var(--accent)')
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = 'var(--border)')
                }
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontFamily: 'var(--font-syne)',
                  color: 'var(--muted)',
                  marginBottom: '7px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Contrasena
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={inputStyle}
                onFocus={(e) =>
                  (e.target.style.borderColor = 'var(--accent)')
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = 'var(--border)')
                }
              />
            </div>

            {error && (
              <p
                style={{
                  color: 'var(--danger)',
                  fontSize: '13px',
                  fontFamily: 'var(--font-syne)',
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="press-scale"
              style={{
                width: '100%',
                background: loading ? '#1C1C1C' : 'var(--accent)',
                color: loading ? 'var(--muted)' : '#0A0A0A',
                border: 'none',
                borderRadius: '10px',
                padding: '14px',
                fontSize: '15px',
                fontWeight: 700,
                fontFamily: 'var(--font-syne)',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                marginTop: '4px',
              }}
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <p
            style={{
              textAlign: 'center',
              marginTop: '24px',
              fontSize: '13px',
              color: 'var(--muted)',
              fontFamily: 'var(--font-syne)',
            }}
          >
            Sin cuenta?{' '}
            <Link
              href="/register"
              style={{ color: 'var(--accent)', textDecoration: 'none' }}
            >
              Registrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
