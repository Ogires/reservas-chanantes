import { InvalidMoneyError } from '../errors/domain-errors'
import type { Currency, Locale } from '../types'

const CURRENCY_FORMATS: Record<Currency, (amount: string) => string> = {
  EUR: (a) => `${a} €`,
  USD: (a) => `$${a}`,
  GBP: (a) => `£${a}`,
}

export class Money {
  readonly amountCents: number
  readonly currency: Currency

  constructor(amountCents: number, currency: Currency) {
    if (amountCents < 0 || !Number.isInteger(amountCents)) {
      throw new InvalidMoneyError(
        `Amount must be a non-negative integer (cents). Got: ${amountCents}`
      )
    }
    this.amountCents = amountCents
    this.currency = currency
  }

  format(): string {
    const decimal = (this.amountCents / 100).toFixed(2)
    return CURRENCY_FORMATS[this.currency](decimal)
  }

  formatLocalized(locale: Locale): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: this.currency,
    }).format(this.amountCents / 100)
  }

  equals(other: Money): boolean {
    return (
      this.amountCents === other.amountCents && this.currency === other.currency
    )
  }
}
