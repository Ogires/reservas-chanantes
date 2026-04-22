import { InvalidEmailError } from '@/domain/errors/domain-errors'

const EMAIL_REGEX =
  /^[A-Za-z0-9._%+-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/

export class EmailAddress {
  private constructor(public readonly value: string) {}

  static create(raw: string): EmailAddress {
    const trimmed = (raw ?? '').trim().toLowerCase()
    if (trimmed.length === 0 || trimmed.length > 254) {
      throw new InvalidEmailError(raw)
    }
    if (trimmed.includes('..')) {
      throw new InvalidEmailError(raw)
    }
    if (!EMAIL_REGEX.test(trimmed)) {
      throw new InvalidEmailError(raw)
    }
    return new EmailAddress(trimmed)
  }
}
