import { describe, it, expect } from 'vitest'
import { getEmailTranslations } from './email-translations'

describe('getEmailTranslations', () => {
  it('returns Spanish translations for es-ES', () => {
    const t = getEmailTranslations('es-ES')
    expect(t.labels.service).toBe('Servicio')
    expect(t.subjects.confirmation('Corte')).toBe('Reserva confirmada – Corte')
    expect(t.body.confirmationIntro).toContain('confirmada')
    expect(t.footer('Mi Negocio')).toContain('Mi Negocio')
  })

  it('returns English translations for en-US', () => {
    const t = getEmailTranslations('en-US')
    expect(t.labels.service).toBe('Service')
    expect(t.subjects.confirmation('Haircut')).toBe('Booking confirmed – Haircut')
    expect(t.body.confirmationIntro).toContain('confirmed')
    expect(t.footer('My Business')).toContain('My Business')
  })

  it('all subject builders return strings with service name', () => {
    for (const locale of ['es-ES', 'en-US'] as const) {
      const t = getEmailTranslations(locale)
      for (const key of Object.keys(t.subjects) as (keyof typeof t.subjects)[]) {
        expect(t.subjects[key]('TestService')).toContain('TestService')
      }
    }
  })
})
