export type Currency = 'EUR' | 'USD' | 'GBP'

export type Locale = 'es-ES' | 'en-US'

export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  /** El cliente paga online mediante Stripe (confirmación vía webhook). */
  ONLINE = 'ONLINE',
  /** El cliente reserva ahora y paga en persona al acudir al centro. */
  ON_SITE = 'ON_SITE',
}

export enum TenantPlan {
  FREE = 'FREE',
  PRO = 'PRO',
}
