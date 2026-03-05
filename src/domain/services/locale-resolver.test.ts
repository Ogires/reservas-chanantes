import { describe, it, expect } from 'vitest'
import { resolveLocale } from './locale-resolver'

describe('resolveLocale', () => {
  it('returns customer preferred locale when set', () => {
    expect(resolveLocale('en-US', 'es-ES')).toBe('en-US')
  })

  it('returns tenant default when customer preference is undefined', () => {
    expect(resolveLocale(undefined, 'es-ES')).toBe('es-ES')
  })

  it('returns customer locale even when same as tenant default', () => {
    expect(resolveLocale('es-ES', 'es-ES')).toBe('es-ES')
  })
})
