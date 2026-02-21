import { requireAdmin } from '@/infrastructure/supabase/admin-auth'
import { SupabaseScheduleRepository } from '@/infrastructure/supabase/schedule-repository'
import { ScheduleEditor } from './schedule-editor'
import { DayOfWeek } from '@/domain/types'

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

export default async function SchedulePage() {
  const { tenant, supabase } = await requireAdmin()
  const scheduleRepo = new SupabaseScheduleRepository(supabase)
  const schedule = await scheduleRepo.findByTenantId(tenant.id)

  const initialSchedule = [0, 1, 2, 3, 4, 5, 6].map((dow) => {
    const daySchedule = schedule?.getDaySchedule(dow as DayOfWeek)
    return {
      dayOfWeek: dow,
      dayName: DAY_NAMES[dow],
      open: !!daySchedule,
      ranges: daySchedule
        ? daySchedule.timeRanges.map((r) => r.toHHMM())
        : [],
    }
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Weekly Schedule</h1>
      <ScheduleEditor initialSchedule={initialSchedule} />
    </div>
  )
}
