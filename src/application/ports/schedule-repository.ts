import type { WeeklySchedule } from '@/domain/entities/weekly-schedule'

export interface ScheduleRepository {
  findByTenantId(tenantId: string): Promise<WeeklySchedule | null>
}
