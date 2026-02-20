import type { Booking } from '@/domain/entities/booking'

export interface BookingRepository {
  findByTenantAndDate(tenantId: string, date: string): Promise<Booking[]>
  save(booking: Booking): Promise<Booking>
}
