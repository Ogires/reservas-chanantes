import type { Currency, Locale } from '../types'

export interface Tenant {
  readonly id: string
  readonly name: string
  readonly slug: string
  readonly currency: Currency
  readonly defaultLocale: Locale
  readonly createdAt: Date
}
