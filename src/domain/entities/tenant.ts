import type { Currency, Locale, TenantPlan } from '../types'
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
  readonly plan: TenantPlan
  readonly stripeAccountId?: string
  readonly stripeAccountEnabled: boolean
}
