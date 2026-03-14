import { requireAdmin } from '@/infrastructure/supabase/admin-auth'
import { SupabaseServiceRepository } from '@/infrastructure/supabase/service-repository'
import { SupabaseScheduleRepository } from '@/infrastructure/supabase/schedule-repository'
import { getAdminTranslations } from '@/infrastructure/i18n/admin-translations'
import { Sidebar } from './sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { tenant, supabase } = await requireAdmin()

  const serviceRepo = new SupabaseServiceRepository(supabase)
  const scheduleRepo = new SupabaseScheduleRepository(supabase)

  const [services, schedule] = await Promise.all([
    serviceRepo.findByTenantId(tenant.id),
    scheduleRepo.findByTenantId(tenant.id),
  ])

  const setupStatus = {
    hasServices: services.some((s) => s.active),
    hasSchedule: schedule !== null,
  }

  const t = getAdminTranslations(tenant.defaultLocale)

  return (
    <div className="flex min-h-screen">
      <Sidebar
        tenant={tenant}
        setupStatus={setupStatus}
        translations={{ nav: t.nav, auth: t.auth }}
      />
      <main className="flex-1 overflow-y-auto bg-warm-bg p-8">{children}</main>
    </div>
  )
}
