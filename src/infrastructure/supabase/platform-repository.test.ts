import { describe, it, expect, vi } from 'vitest'
import { SupabasePlatformRepository } from './platform-repository'
import type { BookingStatsRow, TenantStatsRow } from './platform-repository'

const TENANTS: TenantStatsRow[] = [
  {
    id: 't-1',
    name: 'Peluquería Juan',
    slug: 'peluqueria-juan',
    city: 'Madrid',
    created_at: '2026-01-01T00:00:00Z',
    active: true,
    stripe_account_enabled: true,
    plan: 'FREE',
  },
]

function makeBookingRows(n: number): BookingStatsRow[] {
  return Array.from({ length: n }, () => ({
    tenant_id: 't-1',
    status: 'CONFIRMED',
    payment_method: 'ONLINE',
    customer_id: 'c-1',
    service: { price_cents: 1000 },
  }))
}

/**
 * Mock encadenable de Supabase para el repositorio de plataforma:
 * - `.from('tenants').select(cols)` es *awaitable* → resuelve la lista de tenants.
 * - `.from('bookings').select(cols).range(from,to)` resuelve la página que toque
 *   (según cuántas veces se haya llamado a `.range`).
 */
function makeSupabase(opts: {
  tenants?: TenantStatsRow[]
  pages?: BookingStatsRow[][]
  tenantsError?: { message: string }
  bookingsError?: { message: string }
}) {
  const rangeCalls: Array<[number, number]> = []
  let pageIndex = 0
  const range = vi.fn((from: number, to: number) => {
    rangeCalls.push([from, to])
    if (opts.bookingsError) {
      return Promise.resolve({ data: null, error: opts.bookingsError })
    }
    const page = opts.pages?.[pageIndex] ?? []
    pageIndex++
    return Promise.resolve({ data: page, error: null })
  })
  const order = vi.fn(() => ({ range }))
  const bookingsSelect = vi.fn(() => ({ order, range }))
  const tenantsSelect = vi.fn(() =>
    Promise.resolve({
      data: opts.tenantsError ? null : (opts.tenants ?? []),
      error: opts.tenantsError ?? null,
    })
  )
  const from = vi.fn((table: string) =>
    table === 'tenants' ? { select: tenantsSelect } : { select: bookingsSelect }
  )
  return {
    supabase: { from } as never,
    range,
    order,
    rangeCalls,
    bookingsSelect,
    tenantsSelect,
  }
}

describe('SupabasePlatformRepository.getPlatformData', () => {
  it('paginates bookings and concatenates all pages (does not truncate at 1000)', async () => {
    // Página 1 = 1000 filas (== tope PostgREST) → debe pedir otra página.
    // Página 2 = 1 fila (< 1000) → termina. Total esperado: 1001.
    const { supabase, rangeCalls } = makeSupabase({
      tenants: TENANTS,
      pages: [makeBookingRows(1000), makeBookingRows(1)],
    })
    const repo = new SupabasePlatformRepository(supabase)

    const { bookings } = await repo.getPlatformData()

    expect(bookings).toHaveLength(1001)
    // Verifica que PAGINA con offsets crecientes de 1000, no que trunca.
    expect(rangeCalls).toEqual([
      [0, 999],
      [1000, 1999],
    ])
  })

  it('orders bookings by a stable key before paginating', async () => {
    const { supabase, order } = makeSupabase({
      tenants: TENANTS,
      pages: [makeBookingRows(3)],
    })
    const repo = new SupabasePlatformRepository(supabase)

    await repo.getPlatformData()

    // Sin ORDER BY estable, la paginación por offset puede saltarse/duplicar
    // filas en el límite de página entre peticiones.
    expect(order).toHaveBeenCalledWith('id', { ascending: true })
  })

  it('stops after a single page when it returns fewer than 1000 rows', async () => {
    const { supabase, rangeCalls } = makeSupabase({
      tenants: TENANTS,
      pages: [makeBookingRows(3)],
    })
    const repo = new SupabasePlatformRepository(supabase)

    const { bookings } = await repo.getPlatformData()

    expect(bookings).toHaveLength(3)
    expect(rangeCalls).toEqual([[0, 999]])
  })

  it('fetches an extra (empty) page when a page is exactly 1000 rows', async () => {
    const { supabase, rangeCalls } = makeSupabase({
      tenants: TENANTS,
      pages: [makeBookingRows(1000), []],
    })
    const repo = new SupabasePlatformRepository(supabase)

    const { bookings } = await repo.getPlatformData()

    expect(bookings).toHaveLength(1000)
    expect(rangeCalls).toEqual([
      [0, 999],
      [1000, 1999],
    ])
  })

  it('returns the tenants list unchanged', async () => {
    const { supabase } = makeSupabase({
      tenants: TENANTS,
      pages: [[]],
    })
    const repo = new SupabasePlatformRepository(supabase)

    const { tenants } = await repo.getPlatformData()

    expect(tenants).toEqual(TENANTS)
  })

  it('throws when the tenants query errors', async () => {
    const { supabase } = makeSupabase({
      tenantsError: { message: 'boom-tenants' },
    })
    const repo = new SupabasePlatformRepository(supabase)

    await expect(repo.getPlatformData()).rejects.toThrow(/boom-tenants/)
  })

  it('throws when the bookings query errors', async () => {
    const { supabase } = makeSupabase({
      tenants: TENANTS,
      bookingsError: { message: 'boom-bookings' },
    })
    const repo = new SupabasePlatformRepository(supabase)

    await expect(repo.getPlatformData()).rejects.toThrow(/boom-bookings/)
  })
})

/**
 * Mock encadenable para `setTenantActive`:
 * `.from('tenants').update({active}).eq('id', id)` resuelve `{ error }`.
 */
function makeUpdateSupabase(error: { message: string } | null) {
  const eq = vi.fn(() => Promise.resolve({ error }))
  const update = vi.fn(() => ({ eq }))
  const from = vi.fn(() => ({ update }))
  return { supabase: { from } as never, from, update, eq }
}

describe('SupabasePlatformRepository.setTenantActive', () => {
  it('updates the active flag for the given tenant', async () => {
    const { supabase, from, update, eq } = makeUpdateSupabase(null)
    const repo = new SupabasePlatformRepository(supabase)

    await repo.setTenantActive('t-1', false)

    expect(from).toHaveBeenCalledWith('tenants')
    expect(update).toHaveBeenCalledWith({ active: false })
    expect(eq).toHaveBeenCalledWith('id', 't-1')
  })

  it('throws when the update errors', async () => {
    const { supabase } = makeUpdateSupabase({ message: 'boom-update' })
    const repo = new SupabasePlatformRepository(supabase)

    await expect(repo.setTenantActive('t-1', true)).rejects.toThrow(
      /boom-update/
    )
  })
})
