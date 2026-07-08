import { describe, it, expect, vi } from 'vitest'

const getHeader = vi.fn()
vi.mock('next/headers', () => ({
  headers: async () => ({ get: getHeader }),
}))

import { detectLocaleFromHeaders } from './detect-locale'

describe('detectLocaleFromHeaders', () => {
  it('devuelve en-US cuando Accept-Language empieza por "en"', async () => {
    getHeader.mockReturnValue('en-GB,en;q=0.9')
    expect(await detectLocaleFromHeaders()).toBe('en-US')
  })

  it('devuelve es-ES para español', async () => {
    getHeader.mockReturnValue('es-ES,es;q=0.9')
    expect(await detectLocaleFromHeaders()).toBe('es-ES')
  })

  it('devuelve es-ES por defecto cuando no hay cabecera', async () => {
    getHeader.mockReturnValue(null)
    expect(await detectLocaleFromHeaders()).toBe('es-ES')
  })
})
