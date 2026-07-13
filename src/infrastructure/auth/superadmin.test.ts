import { describe, it, expect } from 'vitest'
import { isSuperadmin } from './superadmin'

describe('isSuperadmin', () => {
  it('true si el email (normalizado) está en la allowlist', () => {
    expect(isSuperadmin('Op@x.com', 'a@x.com, op@x.com')).toBe(true)
  })

  it('false si no está', () => {
    expect(isSuperadmin('x@x.com', 'a@x.com')).toBe(false)
  })

  it('fail-closed: allowlist vacía/indefinida → false', () => {
    expect(isSuperadmin('a@x.com', undefined)).toBe(false)
    expect(isSuperadmin('a@x.com', '  ,  ')).toBe(false)
  })

  it('false si email es null/undefined', () => {
    expect(isSuperadmin(undefined, 'a@x.com')).toBe(false)
    expect(isSuperadmin(null, 'a@x.com')).toBe(false)
  })
})
