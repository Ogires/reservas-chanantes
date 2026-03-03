import type { Locale } from '../types'

export interface Customer {
  readonly id: string
  readonly name: string
  readonly email: string
  readonly phone: string
  readonly authUserId?: string
  readonly preferredLocale?: Locale
}
