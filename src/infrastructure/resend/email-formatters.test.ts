import { describe, it, expect } from 'vitest'
import { formatEmailDate } from './email-formatters'

describe('formatEmailDate', () => {
  it('formats date in Spanish', () => {
    const result = formatEmailDate('2026-03-01', 'es-ES')
    expect(result).toContain('domingo')
    expect(result).toContain('marzo')
    expect(result).toContain('2026')
  })

  it('formats date in English', () => {
    const result = formatEmailDate('2026-03-01', 'en-US')
    expect(result).toContain('Sunday')
    expect(result).toContain('March')
    expect(result).toContain('2026')
  })
})
