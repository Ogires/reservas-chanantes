'use server'

import { requireAdmin } from '@/infrastructure/supabase/admin-auth'
import { SupabaseScheduleRepository } from '@/infrastructure/supabase/schedule-repository'
import { TimeRange } from '@/domain/value-objects/time-range'
import type { DayOfWeek } from '@/domain/types'
import type { DaySchedule } from '@/domain/entities/weekly-schedule'

interface DayInput {
  dayOfWeek: number
  open: boolean
  ranges: Array<{ start: string; end: string }>
}

export async function saveSchedule(
  _prevState: { error: string; success?: boolean } | null,
  formData: FormData
) {
  const { tenant, supabase } = await requireAdmin()
  const scheduleRepo = new SupabaseScheduleRepository(supabase)

  const json = formData.get('schedule') as string

  try {
    const days: DayInput[] = JSON.parse(json)

    const schedules: DaySchedule[] = days
      .filter((d) => d.open && d.ranges.length > 0)
      .map((d) => ({
        dayOfWeek: d.dayOfWeek as DayOfWeek,
        timeRanges: d.ranges.map((r) => TimeRange.fromHHMM(r.start, r.end)),
      }))

    await scheduleRepo.save(tenant.id, schedules)
    return { error: '', success: true }
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'Failed to save schedule',
    }
  }
}
