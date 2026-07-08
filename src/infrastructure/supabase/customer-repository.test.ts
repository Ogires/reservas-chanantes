import { describe, it, expect, vi } from 'vitest'
import { SupabaseCustomerRepository } from './customer-repository'
import type { Customer } from '@/domain/entities/customer'

function makeClient(opts: { single?: unknown; error?: { message: string } } = {}) {
  const singleResult = { data: opts.single ?? null, error: opts.error ?? null }
  const single = vi.fn().mockResolvedValue(singleResult)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const builder: any = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    single,
    then: (resolve: (v: unknown) => void) => resolve(singleResult),
  }
  const from = vi.fn(() => builder)
  return { supabase: { from } as never, builder }
}

const custRow = {
  id: 'c-1',
  name: 'Ana',
  email: 'a@x.com',
  phone: '+34 600',
  auth_user_id: null,
  preferred_locale: 'es-ES',
}

const customer: Customer = {
  id: 'c-1',
  name: 'Ana',
  email: 'a@x.com',
  phone: '+34 600',
  authUserId: undefined,
  preferredLocale: 'es-ES',
}

describe('SupabaseCustomerRepository', () => {
  it('findByEmail mapea la fila (auth_user_id null → undefined)', async () => {
    const { supabase } = makeClient({ single: custRow })
    const c = await new SupabaseCustomerRepository(supabase).findByEmail('a@x.com')
    expect(c?.name).toBe('Ana')
    expect(c?.authUserId).toBeUndefined()
    expect(c?.preferredLocale).toBe('es-ES')
  })

  it('findById devuelve null cuando no hay fila', async () => {
    const { supabase } = makeClient({ single: null })
    expect(await new SupabaseCustomerRepository(supabase).findById('x')).toBeNull()
  })

  it('findByAuthUserId mapea la fila', async () => {
    const { supabase } = makeClient({
      single: { ...custRow, auth_user_id: 'u-1' },
    })
    const c = await new SupabaseCustomerRepository(supabase).findByAuthUserId('u-1')
    expect(c?.authUserId).toBe('u-1')
  })

  it('save inserta el payload correcto y mapea', async () => {
    const { supabase, builder } = makeClient({ single: custRow })
    const saved = await new SupabaseCustomerRepository(supabase).save(customer)
    expect(saved.email).toBe('a@x.com')
    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'a@x.com', auth_user_id: null })
    )
  })

  it('update escribe el payload esperado', async () => {
    const { supabase, builder } = makeClient({ single: custRow })
    await new SupabaseCustomerRepository(supabase).update({
      ...customer,
      phone: '+34 999',
    })
    expect(builder.update).toHaveBeenCalledWith(
      expect.objectContaining({ phone: '+34 999' })
    )
  })
})
