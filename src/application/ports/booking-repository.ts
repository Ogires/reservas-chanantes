import type { Booking } from '@/domain/entities/booking'
import type { BookingStatus } from '@/domain/types'

export interface BookingRepository {
  findByTenantAndDate(tenantId: string, date: string): Promise<Booking[]>
  findByTenantAndDateRange(tenantId: string, startDate: string, endDate: string): Promise<Booking[]>
  findById(id: string): Promise<Booking | null>
  save(booking: Booking): Promise<Booking>
  updateStatus(id: string, status: BookingStatus): Promise<void>
  updateStripeSessionId(id: string, sessionId: string): Promise<void>
  findByCustomerId(customerId: string): Promise<Booking[]>
  findConfirmedForDateWithoutReminder(date: string): Promise<Booking[]>
  /**
   * Atomically claim a booking for reminder sending. Returns true only if
   * this call acquired the claim (reminder_sent_at was NULL and is now set).
   * Returns false if another process already claimed it.
   */
  claimReminder(id: string, sentAt: Date): Promise<boolean>
  /**
   * Release a previously-claimed reminder so it can be retried on the next
   * cron run. Called after a send failure.
   */
  releaseReminder(id: string): Promise<void>
}
