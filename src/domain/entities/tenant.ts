import type { Currency, Locale } from '../types'
import type { BookingPolicy } from '../value-objects/booking-policy'

export interface Tenant {
  readonly id: string
  readonly ownerId: string
  readonly name: string
  readonly slug: string
  readonly currency: Currency
  readonly defaultLocale: Locale
  readonly bookingPolicy: BookingPolicy
  readonly createdAt: Date
}
