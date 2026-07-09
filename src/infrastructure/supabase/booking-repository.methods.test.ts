import { describe, it, expect, vi } from 'vitest'
import { SupabaseBookingRepository } from './booking-repository'
import { BookingStatus, PaymentMethod } from '@/domain/types'

/** Mock encadenable de Supabase: los métodos devuelven el propio builder; el
 * builder es awaitable (resuelve la lista) y `.single()` resuelve el registro.
 * Cubre las cadenas de consulta/actualización del repositorio de reservas. */
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
    gte: vi.fn(() => builder),
    lte: vi.fn(() => builder),
    order: vi.fn(() => builder),
    is: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    single,
    then: (resolve: (v: unknown) => void) => resolve(listResult),
  }
  return { supabase: { from: vi.fn(() => builder) } as never }
}

const bookingRow = {
  id: 'bk-1',
  tenant_id: 't-1',
  service_id: 's-1',
  customer_id: 'c-1',
  date: '2026-05-01',
  start_minutes: 540,
  end_minutes: 570,
  status: 'CONFIRMED',
  payment_method: 'ON_SITE',
  stripe_checkout_session_id: 'cs_123',
  created_at: '2026-04-22T10:00:00Z',
}

const repo = (opts?: Parameters<typeof chain>[0]) =>
  new SupabaseBookingRepository(chain(opts).supabase)

describe('SupabaseBookingRepository — consultas y actualizaciones', () => {
  it('findByTenantAndDate mapea la lista (incluye paymentMethod y sessionId)', async () => {
    const r = await repo({ list: [bookingRow] }).findByTenantAndDate('t-1', '2026-05-01')
    expect(r).toHaveLength(1)
    expect(r[0].paymentMethod).toBe(PaymentMethod.ON_SITE)
    expect(r[0].stripeCheckoutSessionId).toBe('cs_123')
  })

  it('findByTenantAndDate lanza en error', async () => {
    await expect(
      repo({ error: { message: 'boom' } }).findByTenantAndDate('t-1', 'd')
    ).rejects.toThrow(/Failed to fetch bookings/)
  })

  it('findByTenantAndDateRange mapea la lista', async () => {
    const r = await repo({ list: [bookingRow] }).findByTenantAndDateRange('t-1', 'a', 'b')
    expect(r).toHaveLength(1)
  })

  it('findByTenantAndDateRange lanza en error', async () => {
    await expect(
      repo({ error: { message: 'x' } }).findByTenantAndDateRange('t-1', 'a', 'b')
    ).rejects.toThrow(/Failed to fetch bookings/)
  })

  it('findById devuelve null cuando Postgres responde PGRST116 (0 filas)', async () => {
    expect(await repo({ error: { code: 'PGRST116', message: 'no rows' } }).findById('x')).toBeNull()
  })

  it('findById relanza otros errores', async () => {
    await expect(
      repo({ error: { code: '500', message: 'boom' } }).findById('x')
    ).rejects.toThrow(/Failed to fetch booking/)
  })

  it('findById mapea la reserva en éxito', async () => {
    expect((await repo({ single: bookingRow }).findById('bk-1'))?.id).toBe('bk-1')
  })

  it('updateStatus resuelve en éxito', async () => {
    await expect(
      repo({}).updateStatus('bk-1', BookingStatus.CONFIRMED)
    ).resolves.toBeUndefined()
  })

  it('updateStatus lanza en error', async () => {
    await expect(
      repo({ error: { message: 'x' } }).updateStatus('bk-1', BookingStatus.CONFIRMED)
    ).rejects.toThrow(/Failed to update booking status/)
  })

  it('updateStripeSessionId resuelve y lanza', async () => {
    await expect(repo({}).updateStripeSessionId('bk-1', 'cs')).resolves.toBeUndefined()
    await expect(
      repo({ error: { message: 'x' } }).updateStripeSessionId('bk-1', 'cs')
    ).rejects.toThrow(/stripe session id/)
  })

  it('findByCustomerId mapea la lista', async () => {
    expect(await repo({ list: [bookingRow] }).findByCustomerId('c-1')).toHaveLength(1)
  })

  it('findByCustomerId lanza en error', async () => {
    await expect(
      repo({ error: { message: 'x' } }).findByCustomerId('c-1')
    ).rejects.toThrow(/Failed to fetch customer bookings/)
  })

  it('findConfirmedForDateWithoutReminder mapea y lanza', async () => {
    expect(
      await repo({ list: [bookingRow] }).findConfirmedForDateWithoutReminder('d')
    ).toHaveLength(1)
    await expect(
      repo({ error: { message: 'x' } }).findConfirmedForDateWithoutReminder('d')
    ).rejects.toThrow(/for reminder/)
  })

  it('releaseReminder resuelve y lanza', async () => {
    await expect(repo({}).releaseReminder('bk-1')).resolves.toBeUndefined()
    await expect(
      repo({ error: { message: 'x' } }).releaseReminder('bk-1')
    ).rejects.toThrow(/Failed to release reminder/)
  })
})
