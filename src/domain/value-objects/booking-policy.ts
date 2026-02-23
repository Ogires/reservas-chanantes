import { InvalidBookingPolicyError } from '../errors/domain-errors'

export interface BookingPolicy {
  readonly timezone: string
  readonly minAdvanceMinutes: number
  readonly maxAdvanceDays: number
}

export function createBookingPolicy(
  partial?: Partial<BookingPolicy>
): BookingPolicy {
  const timezone = partial?.timezone ?? 'Europe/Madrid'
  const minAdvanceMinutes = partial?.minAdvanceMinutes ?? 120
  const maxAdvanceDays = partial?.maxAdvanceDays ?? 30

  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone })
  } catch {
    throw new InvalidBookingPolicyError(`Invalid timezone: "${timezone}"`)
  }

  if (minAdvanceMinutes < 0 || minAdvanceMinutes > 43200) {
    throw new InvalidBookingPolicyError(
      'minAdvanceMinutes must be between 0 and 43200'
    )
  }
  if (maxAdvanceDays < 1 || maxAdvanceDays > 365) {
    throw new InvalidBookingPolicyError(
      'maxAdvanceDays must be between 1 and 365'
    )
  }

  return { timezone, minAdvanceMinutes, maxAdvanceDays }
}
