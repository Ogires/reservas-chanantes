import { describe, it, expect } from 'vitest'
import { getAdminTranslations } from './admin-translations'

describe('getAdminTranslations', () => {
  it('returns Spanish translations for es-ES', () => {
    const t = getAdminTranslations('es-ES')
    expect(t.auth.signIn).toBe('Iniciar sesion')
    expect(t.nav.dashboard).toBe('Panel')
    expect(t.services.title).toBe('Servicios')
    expect(t.schedule.timesInTimezone('Europe/Madrid')).toContain('Europe/Madrid')
    expect(t.auth.hello('Juan')).toContain('Juan')
  })

  it('returns English translations for en-US', () => {
    const t = getAdminTranslations('en-US')
    expect(t.auth.signIn).toBe('Sign in')
    expect(t.nav.dashboard).toBe('Dashboard')
    expect(t.services.title).toBe('Services')
    expect(t.schedule.timesInTimezone('Europe/Madrid')).toContain('Europe/Madrid')
    expect(t.auth.hello('John')).toContain('John')
  })

  it('both locales have 7 day names', () => {
    for (const locale of ['es-ES', 'en-US'] as const) {
      const t = getAdminTranslations(locale)
      expect(t.schedule.days).toHaveLength(7)
      t.schedule.days.forEach((day) => expect(day.length).toBeGreaterThan(0))
    }
  })

  it('all string values are non-empty in both locales', () => {
    for (const locale of ['es-ES', 'en-US'] as const) {
      const t = getAdminTranslations(locale)
      for (const section of Object.values(t)) {
        for (const [key, value] of Object.entries(section)) {
          if (typeof value === 'string') {
            expect(value.length, `${locale} ${key}`).toBeGreaterThan(0)
          }
        }
      }
    }
  })
})
