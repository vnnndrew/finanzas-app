'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { LayoutDashboard, List, Settings, LogOut } from 'lucide-react'

const NAV = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transacciones', icon: List },
  { href: '/settings', label: 'Configuración', icon: Settings },
]

export function Sidebar() {
  const path = usePathname()

  return (
    <aside style={{
      width: '220px',
      minHeight: '100vh',
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 16px',
      position: 'fixed',
      top: 0,
      left: 0,
      bottom: 0,
      zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px', paddingLeft: '4px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px',
          background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '14px', fontWeight: 600, color: '#0A0A0A' }}>₱</span>
        </div>
        <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '16px', color: 'var(--text)' }}>
          finanzas
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = path === href
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                background: active ? 'var(--accent-dim)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--muted)',
                textDecoration: 'none',
                fontFamily: 'var(--font-syne)',
                fontSize: '14px',
                fontWeight: active ? 600 : 400,
                transition: 'all 0.15s',
                border: active ? '1px solid rgba(0,208,132,0.2)' : '1px solid transparent',
              }}
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.color = 'var(--text)'
                  ;(e.currentTarget as HTMLElement).style.background = 'var(--card)'
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.color = 'var(--muted)'
                  ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                }
              }}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 12px',
          borderRadius: '8px',
          background: 'transparent',
          border: '1px solid transparent',
          color: 'var(--muted)',
          fontFamily: 'var(--font-syne)',
          fontSize: '14px',
          cursor: 'pointer',
          width: '100%',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => {
          ;(e.currentTarget as HTMLElement).style.color = 'var(--danger)'
          ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,77,77,0.08)'
        }}
        onMouseLeave={e => {
          ;(e.currentTarget as HTMLElement).style.color = 'var(--muted)'
          ;(e.currentTarget as HTMLElement).style.background = 'transparent'
        }}
      >
        <LogOut size={16} />
        Cerrar sesión
      </button>
    </aside>
  )
}
