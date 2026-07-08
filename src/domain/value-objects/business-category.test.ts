import { describe, it, expect } from 'vitest'
import {
  BUSINESS_CATEGORIES,
  getCategoryLabels,
  CATEGORY_LABELS,
} from './business-category'

describe('business-category', () => {
  it('define el catálogo de categorías esperado', () => {
    expect(BUSINESS_CATEGORIES).toContain('HairSalon')
    expect(BUSINESS_CATEGORIES).toContain('Veterinarian')
    expect(BUSINESS_CATEGORIES.length).toBe(18)
  })

  it('getCategoryLabels devuelve las etiquetas en español', () => {
    const es = getCategoryLabels('es-ES')
    expect(es.HairSalon).toBe('Peluqueria')
    expect(es.LocalBusiness).toBe('Otro / General')
    expect(es.Veterinarian).toBe('Veterinario')
  })

  it('getCategoryLabels devuelve las etiquetas en inglés', () => {
    const en = getCategoryLabels('en-US')
    expect(en.HairSalon).toBe('Hair Salon')
    expect(en.FoodEstablishment).toBe('Restaurant / Cafe')
  })

  it('toda categoría tiene etiqueta no vacía en ambos idiomas', () => {
    for (const locale of ['es-ES', 'en-US'] as const) {
      const labels = getCategoryLabels(locale)
      for (const category of BUSINESS_CATEGORIES) {
        expect(labels[category]).toBeTruthy()
      }
    }
  })

  it('CATEGORY_LABELS (deprecado) equivale a las etiquetas en inglés', () => {
    expect(CATEGORY_LABELS).toEqual(getCategoryLabels('en-US'))
  })
})
