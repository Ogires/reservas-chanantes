import { describe, it, expect, vi } from 'vitest'
import { SupabaseBookingRepository } from './booking-repository'
import { SlotTakenError } from '@/domain/errors/domain-errors'
import { TimeRange } from '@/domain/value-objects/time-range'
import { BookingStatus } from '@/domain/types'
import type { Booking } from '@/domain/entities/booking'

function makeBooking(): Booking {
  return {
    id: 'bk-1',
    tenantId: 't-1',
    serviceId: 's-1',
    customerId: 'c-1',
    date: '2026-05-01',
    timeRange: new TimeRange(540, 570),
    status: BookingStatus.PENDING,
    createdAt: new Date(),
  }
}

function mockSupabaseForSave(result: {
  data: unknown
  error: { code?: string; message: string } | null
}) {
  const single = vi.fn().mockResolvedValue(result)
  const select = vi.fn().mockReturnValue({ single })
  const insert = vi.fn().mockReturnValue({ select })
  const from = vi.fn().mockReturnValue({ insert })
  return { from } as never
}

describe('SupabaseBookingRepository.save', () => {
  it('throws SlotTakenError when Postgres returns exclusion_violation (23P01)', async () => {
    const supabase = mockSupabaseForSave({
      data: null,
      error: {
        code: '23P01',
        message:
          'conflicting key value violates exclusion constraint "bookings_no_overlap"',
      },
    })
    const repo = new SupabaseBookingRepository(supabase)

    await expect(repo.save(makeBooking())).rejects.toThrow(SlotTakenError)
  })

  it('re-throws other DB errors as generic Error', async () => {
    const supabase = mockSupabaseForSave({
      data: null,
      error: { code: '23505', message: 'duplicate key' },
    })
    const repo = new SupabaseBookingRepository(supabase)

    await expect(repo.save(makeBooking())).rejects.toThrow(
      /Failed to save booking/
    )
  })

  it('returns the saved booking on success', async () => {
    const supabase = mockSupabaseForSave({
      data: {
        id: 'bk-1',
        tenant_id: 't-1',
        service_id: 's-1',
        customer_id: 'c-1',
        date: '2026-05-01',
        start_minutes: 540,
        end_minutes: 570,
        status: 'PENDING',
        stripe_checkout_session_id: null,
        created_at: '2026-04-22T10:00:00Z',
      },
      error: null,
    })
    const repo = new SupabaseBookingRepository(supabase)

    const result = await repo.save(makeBooking())

    expect(result.id).toBe('bk-1')
    expect(result.status).toBe(BookingStatus.PENDING)
  })
})

function mockSupabaseForClaim(result: {
  data: unknown[] | null
  error: { message: string } | null
}) {
  const select = vi.fn().mockResolvedValue(result)
  const is = vi.fn().mockReturnValue({ select })
  const eq = vi.fn().mockReturnValue({ is })
  const update = vi.fn().mockReturnValue({ eq })
  const from = vi.fn().mockReturnValue({ update })
  return { from } as never
}

describe('SupabaseBookingRepository.claimReminder', () => {
  it('returns true when the row was updated (reminder was NULL)', async () => {
    const supabase = mockSupabaseForClaim({
      data: [{ id: 'bk-1' }],
      error: null,
    })
    const repo = new SupabaseBookingRepository(supabase)

    const result = await repo.claimReminder(
      'bk-1',
      new Date('2026-04-22T10:00:00Z')
    )

    expect(result).toBe(true)
  })

  it('returns false when no row was updated (already claimed)', async () => {
    const supabase = mockSupabaseForClaim({ data: [], error: null })
    const repo = new SupabaseBookingRepository(supabase)

    const result = await repo.claimReminder('bk-1', new Date())

    expect(result).toBe(false)
  })

  it('throws when Supabase returns an error', async () => {
    const supabase = mockSupabaseForClaim({
      data: null,
      error: { message: 'boom' },
    })
    const repo = new SupabaseBookingRepository(supabase)

    await expect(repo.claimReminder('bk-1', new Date())).rejects.toThrow(
      /Failed to claim reminder/
    )
  })
})
