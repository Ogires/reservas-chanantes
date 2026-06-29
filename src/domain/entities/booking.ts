import type { BookingStatus, PaymentMethod } from '../types'
import type { TimeRange } from '../value-objects/time-range'

export interface Booking {
  readonly id: string
  readonly tenantId: string
  readonly serviceId: string
  readonly customerId: string
  readonly date: string // YYYY-MM-DD
  readonly timeRange: TimeRange
  readonly status: BookingStatus
  /** Cómo paga el cliente. Ausente equivale a ONLINE (compatibilidad con reservas previas). */
  readonly paymentMethod?: PaymentMethod
  readonly stripeCheckoutSessionId?: string
  readonly createdAt: Date
}
