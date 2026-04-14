import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { BottomNav } from '@/components/layout/BottomNav'
import { TopHeader } from '@/components/layout/TopHeader'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  return (
    <div className="min-h-screen" style={{ minHeight: '100dvh' }}>
      <TopHeader />
      <main
        style={{
          paddingTop: 'calc(var(--top-header-h) + var(--safe-top) + 12px)',
          paddingBottom: 'calc(var(--bottom-nav-h) + var(--safe-bottom) + 16px)',
          paddingLeft: 'var(--page-px)',
          paddingRight: 'var(--page-px)',
          maxWidth: '480px',
          margin: '0 auto',
          minHeight: '100dvh',
        }}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
