import { describe, it, expect } from 'vitest'
import { Money } from './money'
import { InvalidMoneyError } from '../errors/domain-errors'

describe('Money', () => {
  it('creates money with amount in cents and currency', () => {
    const money = new Money(1500, 'EUR')
    expect(money.amountCents).toBe(1500)
    expect(money.currency).toBe('EUR')
  })

  it('throws for negative amount', () => {
    expect(() => new Money(-1, 'EUR')).toThrow(InvalidMoneyError)
  })

  it('throws for non-integer amount', () => {
    expect(() => new Money(15.5, 'EUR')).toThrow(InvalidMoneyError)
  })

  describe('format', () => {
    it('formats EUR', () => {
      expect(new Money(1550, 'EUR').format()).toBe('15.50 €')
    })

    it('formats USD', () => {
      expect(new Money(1550, 'USD').format()).toBe('$15.50')
    })

    it('formats zero', () => {
      expect(new Money(0, 'EUR').format()).toBe('0.00 €')
    })
  })

  describe('formatLocalized', () => {
    it('formats EUR in es-ES', () => {
      expect(new Money(1550, 'EUR').formatLocalized('es-ES')).toBe('15,50\u00a0€')
    })

    it('formats EUR in en-US', () => {
      expect(new Money(1550, 'EUR').formatLocalized('en-US')).toBe('€15.50')
    })

    it('formats USD in en-US', () => {
      expect(new Money(1550, 'USD').formatLocalized('en-US')).toBe('$15.50')
    })

    it('formats zero', () => {
      expect(new Money(0, 'EUR').formatLocalized('es-ES')).toBe('0,00\u00a0€')
    })
  })

  describe('equals', () => {
    it('returns true for same amount and currency', () => {
      expect(new Money(1500, 'EUR').equals(new Money(1500, 'EUR'))).toBe(true)
    })

    it('returns false for different amount', () => {
      expect(new Money(1500, 'EUR').equals(new Money(2000, 'EUR'))).toBe(false)
    })

    it('returns false for different currency', () => {
      expect(new Money(1500, 'EUR').equals(new Money(1500, 'USD'))).toBe(false)
    })
  })
})
