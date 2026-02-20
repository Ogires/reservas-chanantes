import type { BookingStatus } from '../types'
import type { TimeRange } from '../value-objects/time-range'

export interface Booking {
  readonly id: string
  readonly tenantId: string
  readonly serviceId: string
  readonly customerId: string
  readonly date: string // YYYY-MM-DD
  readonly timeRange: TimeRange
  readonly status: BookingStatus
  readonly createdAt: Date
}
