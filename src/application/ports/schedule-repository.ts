import type { WeeklySchedule, DaySchedule } from '@/domain/entities/weekly-schedule'

export interface ScheduleRepository {
  findByTenantId(tenantId: string): Promise<WeeklySchedule | null>
  save(tenantId: string, schedules: DaySchedule[]): Promise<void>
}
