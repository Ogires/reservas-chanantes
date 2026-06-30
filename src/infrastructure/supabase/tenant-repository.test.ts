import { describe, it, expect, vi } from 'vitest'
import { SupabaseTenantRepository } from './tenant-repository'

type Row = Record<string, unknown>

function baseRow(overrides: Row = {}): Row {
  return {
    id: 't-1',
    owner_id: 'o-1',
    name: 'Peluquería Aurora',
    slug: 'peluqueria-aurora',
    currency: 'EUR',
    default_locale: 'es-ES',
    timezone: 'Europe/Madrid',
    min_advance_minutes: 0,
    max_advance_days: 30,
    created_at: '2026-01-01T00:00:00Z',
    plan: 'FREE',
    stripe_account_id: null,
    stripe_account_enabled: false,
    allow_onsite_payment: false,
    description: null,
    category: null,
    city: null,
    address: null,
    phone: null,
    seo_title: null,
    seo_description: null,
    ...overrides,
  }
}

function mockForSelect(row: Row) {
  const single = vi.fn().mockResolvedValue({ data: row, error: null })
  const eq = vi.fn().mockReturnValue({ single })
  const select = vi.fn().mockReturnValue({ eq })
  const from = vi.fn().mockReturnValue({ select })
  return { from } as never
}

describe('SupabaseTenantRepository — mapeo de allow_onsite_payment', () => {
  it('mapea allow_onsite_payment=true a allowOnSitePayment=true', async () => {
    const repo = new SupabaseTenantRepository(
      mockForSelect(baseRow({ allow_onsite_payment: true }))
    )

    const tenant = await repo.findBySlug('peluqueria-aurora')

    expect(tenant?.allowOnSitePayment).toBe(true)
  })

  it('por defecto allowOnSitePayment es false cuando la columna es null', async () => {
    const repo = new SupabaseTenantRepository(
      mockForSelect(baseRow({ allow_onsite_payment: null }))
    )

    const tenant = await repo.findBySlug('peluqueria-aurora')

    expect(tenant?.allowOnSitePayment).toBe(false)
  })

  it('escribe allow_onsite_payment en el payload de update', async () => {
    const tenant = await new SupabaseTenantRepository(
      mockForSelect(baseRow({ allow_onsite_payment: false }))
    ).findBySlug('peluqueria-aurora')

    const single = vi
      .fn()
      .mockResolvedValue({ data: baseRow({ allow_onsite_payment: true }), error: null })
    const select = vi.fn().mockReturnValue({ single })
    const eq = vi.fn().mockReturnValue({ select })
    const update = vi.fn().mockReturnValue({ eq })
    const repo = new SupabaseTenantRepository({
      from: vi.fn().mockReturnValue({ update }),
    } as never)

    await repo.update({ ...tenant!, allowOnSitePayment: true })

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ allow_onsite_payment: true })
    )
  })
})
