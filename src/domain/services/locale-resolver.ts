import type { Locale } from '../types'

export function resolveLocale(
  customerPreferred: Locale | undefined,
  tenantDefault: Locale
): Locale {
  return customerPreferred ?? tenantDefault
}
