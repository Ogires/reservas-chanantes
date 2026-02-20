import type { DayOfWeek } from '../types'
import type { TimeRange } from '../value-objects/time-range'

export interface DaySchedule {
  readonly dayOfWeek: DayOfWeek
  readonly timeRanges: TimeRange[]
}

export class WeeklySchedule {
  readonly tenantId: string
  private readonly days: Map<DayOfWeek, DaySchedule>

  constructor(tenantId: string, schedules: DaySchedule[]) {
    this.tenantId = tenantId
    this.days = new Map(schedules.map((s) => [s.dayOfWeek, s]))
  }

  getDaySchedule(day: DayOfWeek): DaySchedule | null {
    return this.days.get(day) ?? null
  }

  isOpenOn(day: DayOfWeek): boolean {
    return this.days.has(day)
  }
}
