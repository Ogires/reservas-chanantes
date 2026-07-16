import { requireAdmin } from '@/infrastructure/supabase/admin-auth'
import { SupabaseServiceRepository } from '@/infrastructure/supabase/service-repository'
import { SupabaseScheduleRepository } from '@/infrastructure/supabase/schedule-repository'
import { getAdminTranslations } from '@/infrastructure/i18n/admin-translations'
import { isSuperadmin } from '@/infrastructure/auth/superadmin'
import { env } from '@/infrastructure/config/env'
import { Sidebar } from './sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { tenant, supabase } = await requireAdmin()

  // Enlace condicional a /superadmin: solo visible si el email del usuario esta
  // en la allowlist de operadores (fail-closed). La autorizacion real la impone
  // `requireSuperadmin()` en la propia ruta; esto es solo descubribilidad.
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const showSuperadmin = isSuperadmin(user?.email, env.SUPERADMIN_EMAILS)

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
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar
        tenant={tenant}
        setupStatus={setupStatus}
        showSuperadmin={showSuperadmin}
        translations={{ nav: t.nav, auth: { signOut: t.auth.signOut } }}
      />
      <main className="flex-1 overflow-y-auto bg-warm-bg p-4 sm:p-6 md:p-8">{children}</main>
    </div>
  )
}
