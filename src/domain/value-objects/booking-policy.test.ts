import { describe, it, expect } from 'vitest'
import { createBookingPolicy } from './booking-policy'
import { InvalidBookingPolicyError } from '../errors/domain-errors'

describe('createBookingPolicy', () => {
  it('returns defaults when called without arguments', () => {
    const policy = createBookingPolicy()
    expect(policy.timezone).toBe('Europe/Madrid')
    expect(policy.minAdvanceMinutes).toBe(120)
    expect(policy.maxAdvanceDays).toBe(30)
  })

  it('accepts partial overrides', () => {
    const policy = createBookingPolicy({ timezone: 'UTC', minAdvanceMinutes: 0 })
    expect(policy.timezone).toBe('UTC')
    expect(policy.minAdvanceMinutes).toBe(0)
    expect(policy.maxAdvanceDays).toBe(30)
  })

  it('throws on negative minAdvanceMinutes', () => {
    expect(() => createBookingPolicy({ minAdvanceMinutes: -1 })).toThrow(
      InvalidBookingPolicyError
    )
  })

  it('throws on zero maxAdvanceDays', () => {
    expect(() => createBookingPolicy({ maxAdvanceDays: 0 })).toThrow(
      InvalidBookingPolicyError
    )
  })

  it('throws on minAdvanceMinutes exceeding upper bound', () => {
    expect(() => createBookingPolicy({ minAdvanceMinutes: 43201 })).toThrow(
      InvalidBookingPolicyError
    )
  })

  it('throws on maxAdvanceDays exceeding upper bound', () => {
    expect(() => createBookingPolicy({ maxAdvanceDays: 366 })).toThrow(
      InvalidBookingPolicyError
    )
  })

  it('throws on invalid timezone', () => {
    expect(() => createBookingPolicy({ timezone: 'Foo/Bar' })).toThrow(
      InvalidBookingPolicyError
    )
  })

  it('allows minAdvanceMinutes = 0', () => {
    const policy = createBookingPolicy({ minAdvanceMinutes: 0 })
    expect(policy.minAdvanceMinutes).toBe(0)
  })

  it('allows maxAdvanceDays = 1', () => {
    const policy = createBookingPolicy({ maxAdvanceDays: 1 })
    expect(policy.maxAdvanceDays).toBe(1)
  })

  it('allows maxAdvanceDays = 365', () => {
    const policy = createBookingPolicy({ maxAdvanceDays: 365 })
    expect(policy.maxAdvanceDays).toBe(365)
  })

  it('allows minAdvanceMinutes = 43200', () => {
    const policy = createBookingPolicy({ minAdvanceMinutes: 43200 })
    expect(policy.minAdvanceMinutes).toBe(43200)
  })
})
