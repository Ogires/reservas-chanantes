import { describe, it, expect, vi } from 'vitest'
import { SupabaseTenantRepository } from './tenant-repository'
import { TenantPlan } from '@/domain/types'
import type { Tenant } from '@/domain/entities/tenant'

function chain(opts: {
  list?: unknown
  single?: unknown
  error?: { code?: string; message: string }
} = {}) {
  const listResult = { data: opts.list ?? null, error: opts.error ?? null }
  const singleResult = { data: opts.single ?? null, error: opts.error ?? null }
  const single = vi.fn().mockResolvedValue(singleResult)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const builder: any = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    single,
    then: (resolve: (v: unknown) => void) => resolve(listResult),
  }
  return { supabase: { from: vi.fn(() => builder) } as never, builder }
}

// Fila con TODOS los campos nullable poblados: ejercita la rama "presente" de
// cada `?? undefined` / `?? default` del mapeo (la fila null se cubre aparte).
const fullRow = {
  id: 't-1',
  owner_id: 'o-1',
  name: 'Peluquería Aurora',
  slug: 'peluqueria-aurora',
  currency: 'EUR',
  default_locale: 'es-ES',
  timezone: 'Europe/Madrid',
  min_advance_minutes: 120,
  max_advance_days: 30,
  created_at: '2026-01-01T00:00:00Z',
  plan: 'PRO',
  stripe_account_id: 'acct_1',
  stripe_account_enabled: true,
  allow_onsite_payment: true,
  description: 'La mejor peluquería',
  category: 'HairSalon',
  city: 'Madrid',
  address: 'Calle Gran Vía 1',
  phone: '+34 600 000 000',
  seo_title: 'Reserva en Aurora',
  seo_description: 'Reserva tu cita',
}

const domainTenant = (): Tenant => ({
  id: 't-1',
  ownerId: 'o-1',
  name: 'Peluquería Aurora',
  slug: 'peluqueria-aurora',
  currency: 'EUR',
  defaultLocale: 'es-ES',
  bookingPolicy: { timezone: 'Europe/Madrid', minAdvanceMinutes: 120, maxAdvanceDays: 30 },
  createdAt: new Date('2026-01-01T00:00:00Z'),
  plan: TenantPlan.PRO,
  active: true,
  stripeAccountId: 'acct_1',
  stripeAccountEnabled: true,
  allowOnSitePayment: true,
  description: 'La mejor peluquería',
  category: 'HairSalon',
  city: 'Madrid',
  address: 'Calle Gran Vía 1',
  phone: '+34 600 000 000',
  seoTitle: 'Reserva en Aurora',
  seoDescription: 'Reserva tu cita',
})

describe('SupabaseTenantRepository — mapeo y métodos', () => {
  it('findBySlug mapea TODOS los campos cuando están poblados', async () => {
    const t = await new SupabaseTenantRepository(chain({ single: fullRow }).supabase).findBySlug('peluqueria-aurora')
    expect(t?.plan).toBe(TenantPlan.PRO)
    expect(t?.stripeAccountId).toBe('acct_1')
    expect(t?.stripeAccountEnabled).toBe(true)
    expect(t?.allowOnSitePayment).toBe(true)
    expect(t?.description).toBe('La mejor peluquería')
    expect(t?.category).toBe('HairSalon')
    expect(t?.city).toBe('Madrid')
    expect(t?.address).toBe('Calle Gran Vía 1')
    expect(t?.phone).toBe('+34 600 000 000')
    expect(t?.seoTitle).toBe('Reserva en Aurora')
    expect(t?.seoDescription).toBe('Reserva tu cita')
  })

  it('findBySlug devuelve null cuando hay error o no hay fila', async () => {
    expect(await new SupabaseTenantRepository(chain({ error: { message: 'x' } }).supabase).findBySlug('x')).toBeNull()
    expect(await new SupabaseTenantRepository(chain({ single: null }).supabase).findBySlug('x')).toBeNull()
  })

  it('findById y findByOwnerId mapean en éxito', async () => {
    expect((await new SupabaseTenantRepository(chain({ single: fullRow }).supabase).findById('t-1'))?.id).toBe('t-1')
    expect((await new SupabaseTenantRepository(chain({ single: fullRow }).supabase).findByOwnerId('o-1'))?.ownerId).toBe('o-1')
  })

  it('save devuelve el tenant en éxito y lanza en error', async () => {
    expect((await new SupabaseTenantRepository(chain({ single: fullRow }).supabase).save(domainTenant())).id).toBe('t-1')
    await expect(
      new SupabaseTenantRepository(chain({ error: { message: 'x' } }).supabase).save(domainTenant())
    ).rejects.toThrow(/Failed to save tenant/)
  })

  it('update escribe el payload y por defecto category = LocalBusiness cuando falta', async () => {
    const { supabase, builder } = chain({ single: fullRow })
    await new SupabaseTenantRepository(supabase).update({
      ...domainTenant(),
      category: undefined,
      description: undefined,
    })
    expect(builder.update).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'LocalBusiness', description: null })
    )
  })

  it('update lanza en error', async () => {
    await expect(
      new SupabaseTenantRepository(chain({ error: { message: 'x' } }).supabase).update(domainTenant())
    ).rejects.toThrow(/Failed to update tenant/)
  })

  it('updateStripeAccount resuelve y lanza', async () => {
    await expect(
      new SupabaseTenantRepository(chain({}).supabase).updateStripeAccount('t-1', 'acct_1', true)
    ).resolves.toBeUndefined()
    await expect(
      new SupabaseTenantRepository(chain({ error: { message: 'x' } }).supabase).updateStripeAccount('t-1', 'acct_1', true)
    ).rejects.toThrow(/Failed to update stripe account/)
  })

  it('updateStripeAccountEnabled resuelve y lanza', async () => {
    await expect(
      new SupabaseTenantRepository(chain({}).supabase).updateStripeAccountEnabled('acct_1', false)
    ).resolves.toBeUndefined()
    await expect(
      new SupabaseTenantRepository(chain({ error: { message: 'x' } }).supabase).updateStripeAccountEnabled('acct_1', false)
    ).rejects.toThrow(/stripe account enabled/)
  })
})
