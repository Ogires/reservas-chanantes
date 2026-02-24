import { describe, it, expect } from 'vitest'
import { GetAvailabilityUseCase } from './get-availability'
import type { TenantRepository } from '../ports/tenant-repository'
import type { ScheduleRepository } from '../ports/schedule-repository'
import type { BookingRepository } from '../ports/booking-repository'
import type { Tenant } from '@/domain/entities/tenant'
import type { Booking } from '@/domain/entities/booking'
import { WeeklySchedule } from '@/domain/entities/weekly-schedule'
import { TimeRange } from '@/domain/value-objects/time-range'
import { DayOfWeek, BookingStatus } from '@/domain/types'
import { TenantNotFoundError } from '@/domain/errors/domain-errors'
import { createBookingPolicy } from '@/domain/value-objects/booking-policy'

const TENANT: Tenant = {
  id: 'tenant-1',
  ownerId: 'owner-1',
  name: 'Peluquería Juan',
  slug: 'peluqueria-juan',
  currency: 'EUR',
  defaultLocale: 'es-ES',
  bookingPolicy: createBookingPolicy({
    minAdvanceMinutes: 0,
    maxAdvanceDays: 365,
    timezone: 'UTC',
  }),
  createdAt: new Date('2026-01-01'),
}

const SCHEDULE = new WeeklySchedule('tenant-1', [
  {
    dayOfWeek: DayOfWeek.MONDAY,
    timeRanges: [
      TimeRange.fromHHMM('09:00', '14:00'),
      TimeRange.fromHHMM('16:00', '20:00'),
    ],
  },
])

function createMockRepos(overrides?: {
  tenant?: Tenant | null
  schedule?: WeeklySchedule | null
  bookings?: Booking[]
}) {
  const tenantRepo: TenantRepository = {
    findBySlug: async () =>
      overrides?.tenant !== undefined ? overrides.tenant : TENANT,
    findById: async () => TENANT,
    findByOwnerId: async () => TENANT,
    save: async (t) => t,
    update: async (t) => t,
  }
  const scheduleRepo: ScheduleRepository = {
    findByTenantId: async () =>
      overrides?.schedule !== undefined ? overrides.schedule : SCHEDULE,
    save: async () => {},
  }
  const bookingRepo: BookingRepository = {
    findByTenantAndDate: async () => overrides?.bookings ?? [],
    findByTenantAndDateRange: async () => [],
    findById: async () => null,
    save: async (b) => b,
    updateStatus: async () => {},
    updateStripeSessionId: async () => {},
  }
  return { tenantRepo, scheduleRepo, bookingRepo }
}

describe('GetAvailabilityUseCase', () => {
  it('returns all slots as available when no bookings', async () => {
    const { tenantRepo, scheduleRepo, bookingRepo } = createMockRepos()
    const useCase = new GetAvailabilityUseCase(
      tenantRepo,
      scheduleRepo,
      bookingRepo
    )

    // 2026-02-23 is a Monday
    const result = await useCase.execute({
      tenantSlug: 'peluqueria-juan',
      date: '2026-02-23',
      now: new Date('2026-02-23T00:00:00Z'),
    })

    expect(result.tenantName).toBe('Peluquería Juan')
    expect(result.date).toBe('2026-02-23')
    // 09:00-14:00 = 10 slots + 16:00-20:00 = 8 slots @ 30min = 18 total
    expect(result.slots).toHaveLength(18)
    expect(result.slots.every((s) => s.available)).toBe(true)
  })

  it('marks booked slots as unavailable', async () => {
    const booking: Booking = {
      id: 'b1',
      tenantId: 'tenant-1',
      serviceId: 's1',
      customerId: 'c1',
      date: '2026-02-23',
      timeRange: TimeRange.fromHHMM('10:00', '11:00'),
      status: BookingStatus.CONFIRMED,
      createdAt: new Date(),
    }
    const { tenantRepo, scheduleRepo, bookingRepo } = createMockRepos({
      bookings: [booking],
    })
    const useCase = new GetAvailabilityUseCase(
      tenantRepo,
      scheduleRepo,
      bookingRepo
    )

    const result = await useCase.execute({
      tenantSlug: 'peluqueria-juan',
      date: '2026-02-23',
      now: new Date('2026-02-23T00:00:00Z'),
    })

    const at10 = result.slots.find((s) => s.start === '10:00')
    const at1030 = result.slots.find((s) => s.start === '10:30')
    const at0900 = result.slots.find((s) => s.start === '09:00')
    expect(at10?.available).toBe(false)
    expect(at1030?.available).toBe(false)
    expect(at0900?.available).toBe(true)
  })

  it('returns empty slots for a closed day', async () => {
    const { tenantRepo, scheduleRepo, bookingRepo } = createMockRepos()
    const useCase = new GetAvailabilityUseCase(
      tenantRepo,
      scheduleRepo,
      bookingRepo
    )

    // 2026-02-22 is a Sunday
    const result = await useCase.execute({
      tenantSlug: 'peluqueria-juan',
      date: '2026-02-22',
      now: new Date('2026-02-22T00:00:00Z'),
    })

    expect(result.slots).toHaveLength(0)
  })

  it('throws TenantNotFoundError for unknown slug', async () => {
    const { tenantRepo, scheduleRepo, bookingRepo } = createMockRepos({
      tenant: null,
    })
    const useCase = new GetAvailabilityUseCase(
      tenantRepo,
      scheduleRepo,
      bookingRepo
    )

    await expect(
      useCase.execute({ tenantSlug: 'unknown', date: '2026-02-23' })
    ).rejects.toThrow(TenantNotFoundError)
  })

  it('filters past slots for today', async () => {
    const tenantWithAdvance: Tenant = {
      ...TENANT,
      bookingPolicy: createBookingPolicy({
        minAdvanceMinutes: 120,
        maxAdvanceDays: 365,
        timezone: 'UTC',
      }),
    }
    const { tenantRepo, scheduleRepo, bookingRepo } = createMockRepos({
      tenant: tenantWithAdvance,
    })
    const useCase = new GetAvailabilityUseCase(
      tenantRepo,
      scheduleRepo,
      bookingRepo
    )

    // "now" is 10:00 UTC on a Monday, minAdvance=120 → cutoff 12:00
    const now = new Date('2026-02-23T10:00:00Z')
    const result = await useCase.execute({
      tenantSlug: 'peluqueria-juan',
      date: '2026-02-23',
      now,
    })

    // All slots before 12:00 should be filtered out
    const earlySlots = result.slots.filter((s) => s.start < '12:00')
    expect(earlySlots).toHaveLength(0)
    // 12:00-14:00 = 4 slots + 16:00-20:00 = 8 slots = 12
    expect(result.slots[0].start).toBe('12:00')
  })

  it('returns empty slots for a past date', async () => {
    const { tenantRepo, scheduleRepo, bookingRepo } = createMockRepos()
    const useCase = new GetAvailabilityUseCase(
      tenantRepo,
      scheduleRepo,
      bookingRepo
    )

    // "now" is Feb 23, querying Feb 20 (past)
    const result = await useCase.execute({
      tenantSlug: 'peluqueria-juan',
      date: '2026-02-20',
      now: new Date('2026-02-23T10:00:00Z'),
    })

    expect(result.slots).toHaveLength(0)
  })

  it('returns empty when date exceeds max advance', async () => {
    const tenantShortWindow: Tenant = {
      ...TENANT,
      bookingPolicy: createBookingPolicy({
        minAdvanceMinutes: 0,
        maxAdvanceDays: 7,
        timezone: 'UTC',
      }),
    }
    const { tenantRepo, scheduleRepo, bookingRepo } = createMockRepos({
      tenant: tenantShortWindow,
    })
    const useCase = new GetAvailabilityUseCase(
      tenantRepo,
      scheduleRepo,
      bookingRepo
    )

    const now = new Date('2026-02-23T10:00:00Z')
    const result = await useCase.execute({
      tenantSlug: 'peluqueria-juan',
      date: '2026-03-23', // way beyond 7 days
      now,
    })

    expect(result.slots).toHaveLength(0)
  })
})
