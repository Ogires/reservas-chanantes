import { requireAdmin } from '@/infrastructure/supabase/admin-auth'
import { Sidebar } from './sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { tenant } = await requireAdmin()

  return (
    <div className="flex min-h-screen">
      <Sidebar tenant={tenant} />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  )
}
