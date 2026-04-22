import { describe, it, expect } from 'vitest'
import { EmailAddress } from './email-address'
import { InvalidEmailError } from '@/domain/errors/domain-errors'

describe('EmailAddress', () => {
  it('accepts a valid email and normalizes to lowercase', () => {
    const email = EmailAddress.create('User@Example.COM')
    expect(email.value).toBe('user@example.com')
  })

  it('trims surrounding whitespace', () => {
    const email = EmailAddress.create('  ana@example.com  ')
    expect(email.value).toBe('ana@example.com')
  })

  it.each([
    '',
    '   ',
    'plainaddress',
    '@missing-local.com',
    'missing-at.com',
    'missing-domain@',
    'a@b',
    'spaces in@local.com',
    'double@@at.com',
    'trailing.dot@example.com.',
  ])('rejects invalid email %j', (invalid) => {
    expect(() => EmailAddress.create(invalid)).toThrow(InvalidEmailError)
  })

  it('accepts plus-addressed emails', () => {
    expect(() => EmailAddress.create('ana+tag@example.com')).not.toThrow()
  })

  it('accepts subdomains', () => {
    expect(() => EmailAddress.create('ana@mail.example.co.uk')).not.toThrow()
  })

  it('rejects emails longer than 254 characters (RFC 5321)', () => {
    const local = 'a'.repeat(64)
    const domain = 'b'.repeat(190) + '.com'
    const tooLong = `${local}@${domain}`
    expect(() => EmailAddress.create(tooLong)).toThrow(InvalidEmailError)
  })
})
