'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Error al registrarse')
      setLoading(false)
      return
    }

    await signIn('credentials', { email, password, redirect: false })
    router.push('/')
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
            Crear cuenta
          </h1>
          <p
            style={{
              color: 'var(--muted)',
              fontSize: '13px',
              marginBottom: '28px',
              fontFamily: 'var(--font-syne)',
            }}
          >
            Empieza a controlar tus gastos
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {[
              {
                label: 'Nombre',
                value: name,
                set: setName,
                type: 'text',
                placeholder: 'Tu nombre',
              },
              {
                label: 'Email',
                value: email,
                set: setEmail,
                type: 'email',
                placeholder: 'tu@email.com',
              },
              {
                label: 'Contrasena',
                value: password,
                set: setPassword,
                type: 'password',
                placeholder: '••••••••',
              },
            ].map(({ label, value, set, type, placeholder }) => (
              <div key={label}>
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
                  {label}
                </label>
                <input
                  type={type}
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  required
                  placeholder={placeholder}
                  style={inputStyle}
                  onFocus={(e) =>
                    (e.target.style.borderColor = 'var(--accent)')
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor = 'var(--border)')
                  }
                />
              </div>
            ))}

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
                marginTop: '4px',
              }}
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
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
            Ya tienes cuenta?{' '}
            <Link
              href="/login"
              style={{ color: 'var(--accent)', textDecoration: 'none' }}
            >
              Ingresar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
