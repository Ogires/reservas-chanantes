import { describe, it, expect, vi } from 'vitest'
import { SupabaseServiceRepository } from './service-repository'
import { Money } from '@/domain/value-objects/money'
import type { Service } from '@/domain/entities/service'

/** Mock encadenable de Supabase: `.select/.eq/.insert/.update/.delete` devuelven
 * el propio builder; el builder es *awaitable* (resuelve `list`) y `.single()`
 * resuelve `single`. Cubre todas las cadenas de los repositorios. */
function makeClient(opts: { list?: unknown; single?: unknown; error?: { message: string } } = {}) {
  const listResult = { data: opts.list ?? null, error: opts.error ?? null }
  const singleResult = { data: opts.single ?? null, error: opts.error ?? null }
  const single = vi.fn().mockResolvedValue(singleResult)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const builder: any = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    single,
    then: (resolve: (v: unknown) => void) => resolve(listResult),
  }
  const from = vi.fn(() => builder)
  return { supabase: { from } as never, builder }
}

const row = {
  id: 's-1',
  tenant_id: 't-1',
  name: 'Corte',
  duration_minutes: 30,
  price_cents: 1500,
  active: true,
}

const service: Service = {
  id: 's-1',
  tenantId: 't-1',
  name: 'Corte',
  durationMinutes: 30,
  price: new Money(1500, 'EUR'),
  active: true,
}

describe('SupabaseServiceRepository', () => {
  it('findById mapea la fila a dominio (price como Money)', async () => {
    const { supabase } = makeClient({ single: row })
    const found = await new SupabaseServiceRepository(supabase).findById('s-1')
    expect(found?.name).toBe('Corte')
    expect(found?.durationMinutes).toBe(30)
    expect(found?.price.amountCents).toBe(1500)
    expect(found?.active).toBe(true)
  })

  it('findById devuelve null si no hay fila', async () => {
    const { supabase } = makeClient({ single: null })
    expect(await new SupabaseServiceRepository(supabase).findById('x')).toBeNull()
  })

  it('findByTenantId mapea la lista de servicios', async () => {
    const { supabase } = makeClient({ list: [row] })
    const list = await new SupabaseServiceRepository(supabase).findByTenantId('t-1')
    expect(list).toHaveLength(1)
    expect(list[0].price.amountCents).toBe(1500)
  })

  it('findByTenantId lanza cuando Supabase devuelve error', async () => {
    const { supabase } = makeClient({ error: { message: 'boom' } })
    await expect(
      new SupabaseServiceRepository(supabase).findByTenantId('t-1')
    ).rejects.toThrow(/boom/)
  })

  it('save inserta el payload correcto y devuelve el servicio mapeado', async () => {
    const { supabase, builder } = makeClient({ single: row })
    const saved = await new SupabaseServiceRepository(supabase).save(service)
    expect(saved.name).toBe('Corte')
    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ price_cents: 1500, duration_minutes: 30 })
    )
  })

  it('delete lanza cuando hay error', async () => {
    const { supabase } = makeClient({ error: { message: 'del' } })
    await expect(
      new SupabaseServiceRepository(supabase).delete('s-1')
    ).rejects.toThrow(/del/)
  })
})
