export class DomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
  }
}

export class InvalidTimeRangeError extends DomainError {
  constructor(start: number, end: number) {
    super(
      `Invalid time range: ${start}-${end}. Start must be < end, both in [0, 1440].`
    )
  }
}

export class InvalidMoneyError extends DomainError {
  constructor(message: string) {
    super(message)
  }
}

export class InvalidSlugError extends DomainError {
  constructor(slug: string) {
    super(
      `Invalid slug: "${slug}". Must be lowercase alphanumeric with hyphens, 3-60 chars.`
    )
  }
}

export class TenantNotFoundError extends DomainError {
  constructor(identifier: string) {
    super(`Tenant not found: "${identifier}"`)
  }
}

export class ServiceNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Service not found: "${id}"`)
  }
}

export class ScheduleNotFoundError extends DomainError {
  constructor(tenantId: string) {
    super(`Schedule not found for tenant: "${tenantId}"`)
  }
}

export class BusinessClosedError extends DomainError {
  constructor(date: string) {
    super(`Business is closed on ${date}`)
  }
}

export class BookingConflictError extends DomainError {
  constructor(message: string) {
    super(message)
  }
}

export class ServiceDoesNotFitError extends DomainError {
  constructor(serviceDuration: number, startTime: string) {
    super(
      `Service (${serviceDuration}min) does not fit starting at ${startTime}`
    )
  }
}

export class BookingTooSoonError extends DomainError {
  constructor(minAdvanceMinutes: number) {
    super(
      `Booking must be made at least ${minAdvanceMinutes} minutes in advance`
    )
  }
}

export class BookingInPastError extends DomainError {
  constructor(date: string) {
    super(`Cannot book date ${date}: it is in the past`)
  }
}

export class BookingTooFarAheadError extends DomainError {
  constructor(maxAdvanceDays: number) {
    super(`Booking cannot be made more than ${maxAdvanceDays} days in advance`)
  }
}

export class InvalidBookingPolicyError extends DomainError {
  constructor(message: string) {
    super(message)
  }
}

export class InvalidPhoneError extends DomainError {
  constructor(phone: string) {
    super(
      `Invalid phone number: "${phone}". Must contain at least 6 digits.`
    )
  }
}
