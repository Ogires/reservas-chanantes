import { requireAdmin } from '@/infrastructure/supabase/admin-auth'
import { SupabaseScheduleRepository } from '@/infrastructure/supabase/schedule-repository'
import { getAdminTranslations } from '@/infrastructure/i18n/admin-translations'
import { ScheduleEditor } from './schedule-editor'
import { DayOfWeek } from '@/domain/types'

export default async function SchedulePage() {
  const { tenant, supabase } = await requireAdmin()
  const t = getAdminTranslations(tenant.defaultLocale)
  const scheduleRepo = new SupabaseScheduleRepository(supabase)
  const schedule = await scheduleRepo.findByTenantId(tenant.id)

  const initialSchedule = [0, 1, 2, 3, 4, 5, 6].map((dow) => {
    const daySchedule = schedule?.getDaySchedule(dow as DayOfWeek)
    return {
      dayOfWeek: dow,
      dayName: t.schedule.days[dow],
      open: !!daySchedule,
      ranges: daySchedule
        ? daySchedule.timeRanges.map((r) => r.toHHMM())
        : [],
    }
  })

  return (
    <div>
      <h1 className="text-2xl font-bold font-serif text-slate-900 mb-6">{t.schedule.title}</h1>
      <ScheduleEditor
        initialSchedule={initialSchedule}
        timezone={tenant.bookingPolicy.timezone}
        translations={t.schedule}
        commonTranslations={t.common}
      />
    </div>
  )
}
