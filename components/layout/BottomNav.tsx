'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { LayoutDashboard, List, Settings, LogOut } from 'lucide-react'

const NAV = [
  { href: '/', label: 'Inicio', icon: LayoutDashboard },
  { href: '/transactions', label: 'Movimientos', icon: List },
  { href: '/settings', label: 'Ajustes', icon: Settings },
]

export function BottomNav() {
  const path = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(10, 10, 10, 0.92)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderTop: '1px solid var(--border)',
        paddingBottom: 'var(--safe-bottom)',
      }}
    >
      <div
        className="flex items-center justify-around"
        style={{
          height: 'var(--bottom-nav-h)',
          maxWidth: '480px',
          margin: '0 auto',
        }}
      >
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? path === '/' : path.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className="press-scale"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 16px',
                textDecoration: 'none',
                borderRadius: '12px',
                transition: 'all 0.2s',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '28px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: active ? 'var(--accent-dim)' : 'transparent',
                  transition: 'background 0.2s',
                }}
              >
                <Icon
                  size={20}
                  strokeWidth={active ? 2.2 : 1.6}
                  color={active ? 'var(--accent)' : 'var(--muted)'}
                />
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-syne)',
                  fontSize: '10px',
                  fontWeight: active ? 600 : 400,
                  color: active ? 'var(--accent)' : 'var(--muted)',
                  letterSpacing: '0.01em',
                }}
              >
                {label}
              </span>
            </Link>
          )
        })}

        {/* Logout */}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="press-scale"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            padding: '8px 16px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '12px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '28px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LogOut size={20} strokeWidth={1.6} color="var(--muted)" />
          </div>
          <span
            style={{
              fontFamily: 'var(--font-syne)',
              fontSize: '10px',
              fontWeight: 400,
              color: 'var(--muted)',
              letterSpacing: '0.01em',
            }}
          >
            Salir
          </span>
        </button>
      </div>
    </nav>
  )
}
