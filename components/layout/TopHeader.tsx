'use client'

import { useSession } from 'next-auth/react'

export function TopHeader() {
  const { data: session } = useSession()
  const firstName = session?.user?.name?.split(' ')[0] ?? ''

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(10, 10, 10, 0.88)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid var(--border)',
        paddingTop: 'var(--safe-top)',
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{
          height: 'var(--top-header-h)',
          padding: '0 var(--page-px)',
          maxWidth: '480px',
          margin: '0 auto',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '7px',
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-dm-mono)',
                fontSize: '12px',
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
              fontSize: '15px',
              color: 'var(--text)',
              letterSpacing: '-0.01em',
            }}
          >
            finanzas
          </span>
        </div>

        {/* User avatar */}
        {firstName && (
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-syne)',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--accent)',
              }}
            >
              {firstName[0]?.toUpperCase()}
            </span>
          </div>
        )}
      </div>
    </header>
  )
}
