import type { Booking } from '@/domain/entities/booking'
import type { BookingStatus } from '@/domain/types'

export interface BookingRepository {
  findByTenantAndDate(tenantId: string, date: string): Promise<Booking[]>
  findByTenantAndDateRange(tenantId: string, startDate: string, endDate: string): Promise<Booking[]>
  findById(id: string): Promise<Booking | null>
  save(booking: Booking): Promise<Booking>
  updateStatus(id: string, status: BookingStatus): Promise<void>
  updateStripeSessionId(id: string, sessionId: string): Promise<void>
  findConfirmedForDateWithoutReminder(date: string): Promise<Booking[]>
  updateReminderSentAt(id: string, sentAt: Date): Promise<void>
}
