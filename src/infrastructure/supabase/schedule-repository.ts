import type { SupabaseClient } from '@supabase/supabase-js'
import type { ScheduleRepository } from '@/application/ports/schedule-repository'
import {
  WeeklySchedule,
  type DaySchedule,
} from '@/domain/entities/weekly-schedule'
import { TimeRange } from '@/domain/value-objects/time-range'
import type { DayOfWeek } from '@/domain/types'

interface ScheduleRow {
  id: string
  tenant_id: string
  day_of_week: number
  time_ranges: Array<{ start: number; end: number }>
}

function toDaySchedule(row: ScheduleRow): DaySchedule {
  return {
    dayOfWeek: row.day_of_week as DayOfWeek,
    timeRanges: row.time_ranges.map((r) => new TimeRange(r.start, r.end)),
  }
}

export class SupabaseScheduleRepository implements ScheduleRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findByTenantId(tenantId: string): Promise<WeeklySchedule | null> {
    const { data, error } = await this.supabase
      .from('schedules')
      .select('*')
      .eq('tenant_id', tenantId)

    if (error) throw new Error(`Failed to fetch schedules: ${error.message}`)
    if (!data || data.length === 0) return null

    const daySchedules = data.map(toDaySchedule)
    return new WeeklySchedule(tenantId, daySchedules)
  }

  async save(tenantId: string, schedules: DaySchedule[]): Promise<void> {
    // Delete existing schedules for this tenant
    const { error: deleteError } = await this.supabase
      .from('schedules')
      .delete()
      .eq('tenant_id', tenantId)

    if (deleteError)
      throw new Error(`Failed to clear schedules: ${deleteError.message}`)

    if (schedules.length === 0) return

    // Insert new schedules
    const rows = schedules.map((s) => ({
      tenant_id: tenantId,
      day_of_week: s.dayOfWeek,
      time_ranges: s.timeRanges.map((r) => ({ start: r.start, end: r.end })),
    }))

    const { error: insertError } = await this.supabase
      .from('schedules')
      .insert(rows)

    if (insertError)
      throw new Error(`Failed to save schedules: ${insertError.message}`)
  }
}
