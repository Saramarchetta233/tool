'use client'

import Navigation from '@/components/Navigation'
import RequirePurchase from '@/components/RequirePurchase'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-950">
      <Navigation />
      <main className="w-full overflow-x-hidden">
        <RequirePurchase>
          {children}
        </RequirePurchase>
      </main>
    </div>
  )
}
