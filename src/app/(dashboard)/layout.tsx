import Navigation from '@/components/Navigation'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-950">
      <Navigation />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}