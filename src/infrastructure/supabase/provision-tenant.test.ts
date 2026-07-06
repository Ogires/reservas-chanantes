import { describe, it, expect, vi, beforeEach } from 'vitest'

const { findByOwnerId, save } = vi.hoisted(() => ({
  findByOwnerId: vi.fn(),
  save: vi.fn(),
}))

vi.mock('./tenant-repository', () => ({
  SupabaseTenantRepository: vi.fn(function () {
    return { findByOwnerId, save }
  }),
}))

import { provisionTenant } from './provision-tenant'

describe('provisionTenant', () => {
  beforeEach(() => {
    findByOwnerId.mockReset()
    save.mockReset()
  })

  it('crea el negocio con los valores por defecto cuando no existe', async () => {
    findByOwnerId.mockResolvedValue(null)

    await provisionTenant({} as never, 'owner-1', 'Barbería Test')

    expect(save).toHaveBeenCalledOnce()
    const arg = save.mock.calls[0][0]
    expect(arg.ownerId).toBe('owner-1')
    expect(arg.name).toBe('Barbería Test')
    expect(arg.slug).toMatch(/^[a-z0-9-]+$/)
    expect(arg.currency).toBe('EUR')
    expect(arg.stripeAccountEnabled).toBe(false)
    expect(arg.allowOnSitePayment).toBe(false)
  })

  it('es idempotente: no crea nada si el negocio ya existe', async () => {
    findByOwnerId.mockResolvedValue({ id: 't-1' })

    await provisionTenant({} as never, 'owner-1', 'Barbería Test')

    expect(save).not.toHaveBeenCalled()
  })
})
