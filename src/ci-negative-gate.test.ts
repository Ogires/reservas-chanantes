import { describe, it, expect } from 'vitest'

// TEST TEMPORAL — prueba negativa del pipeline CI->CD.
// Falla a propósito para verificar que `quality` se pone en rojo y que el
// gate `needs: quality` impide que corran los jobs de deploy/preview.
// Debe borrarse en cuanto se cierre el PR de la prueba.
describe('CI negative gate (temporal)', () => {
  it('falla a proposito para bloquear el pipeline', () => {
    expect(1 + 1).toBe(3)
  })
})
