import { AuthGuard } from '@/components/auth-guard'
import { Navigation, MobileNavigation } from '@/components/layout/navigation'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-6 pb-20 md:pb-6">
          {children}
        </main>
        <MobileNavigation />
      </div>
    </AuthGuard>
  )
}