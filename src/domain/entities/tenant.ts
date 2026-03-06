import type { Currency, Locale, TenantPlan } from '../types'
import type { BookingPolicy } from '../value-objects/booking-policy'
import type { BusinessCategory } from '../value-objects/business-category'

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
  readonly description?: string
  readonly category?: BusinessCategory
  readonly city?: string
  readonly address?: string
  readonly phone?: string
  readonly seoTitle?: string
  readonly seoDescription?: string
}
