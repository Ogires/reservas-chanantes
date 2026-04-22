import { describe, it, expect, vi } from 'vitest'
import { CancelCustomerBookingUseCase } from './cancel-customer-booking'
import type { CustomerRepository } from '../ports/customer-repository'
import type { BookingRepository } from '../ports/booking-repository'
import type { TenantRepository } from '../ports/tenant-repository'
import type { Customer } from '@/domain/entities/customer'
import type { Booking } from '@/domain/entities/booking'
import type { Tenant } from '@/domain/entities/tenant'
import { TimeRange } from '@/domain/value-objects/time-range'
import { BookingStatus } from '@/domain/types'
import { createBookingPolicy } from '@/domain/value-objects/booking-policy'
import {
  CustomerNotFoundError,
  BookingNotFoundError,
  BookingAlreadyCancelledError,
  CancellationTooLateError,
} from '@/domain/errors/domain-errors'

const CUSTOMER: Customer = {
  id: 'customer-1',
  name: 'Ana García',
  email: 'ana@example.com',
  phone: '600123456',
  authUserId: 'auth-1',
}

const TENANT: Tenant = {
  id: 'tenant-1',
  ownerId: 'owner-1',
  name: 'Peluquería Juan',
  slug: 'peluqueria-juan',
  currency: 'EUR',
  defaultLocale: 'es-ES',
  bookingPolicy: createBookingPolicy({
    minAdvanceMinutes: 120,
    maxAdvanceDays: 30,
    timezone: 'UTC',
  }),
  createdAt: new Date('2026-01-01'),
  plan: 'FREE' as const,
  stripeAccountEnabled: false,
} as Tenant

const BOOKING: Booking = {
  id: 'booking-1',
  tenantId: 'tenant-1',
  serviceId: 'service-1',
  customerId: 'customer-1',
  date: '2026-03-10',
  timeRange: TimeRange.fromHHMM('10:00', '10:30'),
  status: BookingStatus.CONFIRMED,
  createdAt: new Date('2026-02-25'),
}

function createMockRepos(overrides?: {
  customer?: Customer | null
  booking?: Booking | null
  tenant?: Tenant | null
}) {
  const customerRepo: CustomerRepository = {
    findById: async () => null,
    findByEmail: async () => null,
    findByAuthUserId: async () =>
      overrides?.customer !== undefined ? overrides.customer : CUSTOMER,
    save: async (c) => c,
    update: async (c) => c,
  }
  const bookingRepo: BookingRepository = {
    findByTenantAndDate: async () => [],
    findByTenantAndDateRange: async () => [],
    findById: async () =>
      overrides?.booking !== undefined ? overrides.booking : BOOKING,
    findByCustomerId: async () => [],
    save: async (b) => b,
    updateStatus: vi.fn(async () => {}),
    updateStripeSessionId: async () => {},
    findConfirmedForDateWithoutReminder: async () => [],
    claimReminder: async () => true,
    releaseReminder: async () => {},
  }
  const tenantRepo: TenantRepository = {
    findBySlug: async () => TENANT,
    findById: async () =>
      overrides?.tenant !== undefined ? overrides.tenant : TENANT,
    findByOwnerId: async () => TENANT,
    save: async (t) => t,
    update: async (t) => t,
    updateStripeAccount: async () => {},
  }
  return { customerRepo, bookingRepo, tenantRepo }
}

describe('CancelCustomerBookingUseCase', () => {
  it('cancels a future booking successfully', async () => {
    const repos = createMockRepos()
    const useCase = new CancelCustomerBookingUseCase(
      repos.customerRepo,
      repos.bookingRepo,
      repos.tenantRepo
    )

    await useCase.execute({
      authUserId: 'auth-1',
      bookingId: 'booking-1',
      now: new Date('2026-03-08T10:00:00Z'),
    })

    expect(repos.bookingRepo.updateStatus).toHaveBeenCalledWith(
      'booking-1',
      BookingStatus.CANCELLED
    )
  })

  it('throws CustomerNotFoundError for unknown auth user', async () => {
    const repos = createMockRepos({ customer: null })
    const useCase = new CancelCustomerBookingUseCase(
      repos.customerRepo,
      repos.bookingRepo,
      repos.tenantRepo
    )

    await expect(
      useCase.execute({
        authUserId: 'unknown',
        bookingId: 'booking-1',
        now: new Date('2026-03-08T10:00:00Z'),
      })
    ).rejects.toThrow(CustomerNotFoundError)
  })

  it('throws BookingNotFoundError for unknown booking', async () => {
    const repos = createMockRepos({ booking: null })
    const useCase = new CancelCustomerBookingUseCase(
      repos.customerRepo,
      repos.bookingRepo,
      repos.tenantRepo
    )

    await expect(
      useCase.execute({
        authUserId: 'auth-1',
        bookingId: 'unknown',
        now: new Date('2026-03-08T10:00:00Z'),
      })
    ).rejects.toThrow(BookingNotFoundError)
  })

  it('throws BookingNotFoundError when booking belongs to another customer', async () => {
    const otherBooking: Booking = { ...BOOKING, customerId: 'other-customer' }
    const repos = createMockRepos({ booking: otherBooking })
    const useCase = new CancelCustomerBookingUseCase(
      repos.customerRepo,
      repos.bookingRepo,
      repos.tenantRepo
    )

    await expect(
      useCase.execute({
        authUserId: 'auth-1',
        bookingId: 'booking-1',
        now: new Date('2026-03-08T10:00:00Z'),
      })
    ).rejects.toThrow(BookingNotFoundError)
  })

  it('throws BookingAlreadyCancelledError for cancelled booking', async () => {
    const cancelledBooking: Booking = {
      ...BOOKING,
      status: BookingStatus.CANCELLED,
    }
    const repos = createMockRepos({ booking: cancelledBooking })
    const useCase = new CancelCustomerBookingUseCase(
      repos.customerRepo,
      repos.bookingRepo,
      repos.tenantRepo
    )

    await expect(
      useCase.execute({
        authUserId: 'auth-1',
        bookingId: 'booking-1',
        now: new Date('2026-03-08T10:00:00Z'),
      })
    ).rejects.toThrow(BookingAlreadyCancelledError)
  })

  it('throws CancellationTooLateError when within min advance on same day', async () => {
    const todayBooking: Booking = {
      ...BOOKING,
      date: '2026-03-10',
      timeRange: TimeRange.fromHHMM('10:00', '10:30'),
    }
    const repos = createMockRepos({ booking: todayBooking })
    const useCase = new CancelCustomerBookingUseCase(
      repos.customerRepo,
      repos.bookingRepo,
      repos.tenantRepo
    )

    // now = 09:00, minAdvance = 120, booking at 10:00
    // 10:00 < 09:00*60 + 120 = 600 + 120 = 660 → 600 < 660 → too late
    await expect(
      useCase.execute({
        authUserId: 'auth-1',
        bookingId: 'booking-1',
        now: new Date('2026-03-10T09:00:00Z'),
      })
    ).rejects.toThrow(CancellationTooLateError)
  })

  it('throws CancellationTooLateError for past date', async () => {
    const pastBooking: Booking = {
      ...BOOKING,
      date: '2026-03-01',
    }
    const repos = createMockRepos({ booking: pastBooking })
    const useCase = new CancelCustomerBookingUseCase(
      repos.customerRepo,
      repos.bookingRepo,
      repos.tenantRepo
    )

    await expect(
      useCase.execute({
        authUserId: 'auth-1',
        bookingId: 'booking-1',
        now: new Date('2026-03-10T10:00:00Z'),
      })
    ).rejects.toThrow(CancellationTooLateError)
  })

  it('allows cancellation when enough advance time on same day', async () => {
    const todayBooking: Booking = {
      ...BOOKING,
      date: '2026-03-10',
      timeRange: TimeRange.fromHHMM('14:00', '14:30'),
    }
    const repos = createMockRepos({ booking: todayBooking })
    const useCase = new CancelCustomerBookingUseCase(
      repos.customerRepo,
      repos.bookingRepo,
      repos.tenantRepo
    )

    // now = 10:00 (600min), minAdvance = 120, booking at 14:00 (840min)
    // 840 >= 600 + 120 = 720 → OK
    await useCase.execute({
      authUserId: 'auth-1',
      bookingId: 'booking-1',
      now: new Date('2026-03-10T10:00:00Z'),
    })

    expect(repos.bookingRepo.updateStatus).toHaveBeenCalledWith(
      'booking-1',
      BookingStatus.CANCELLED
    )
  })

  it('allows cancellation with zero min advance policy', async () => {
    const zeroAdvanceTenant: Tenant = {
      ...TENANT,
      bookingPolicy: createBookingPolicy({
        minAdvanceMinutes: 0,
        maxAdvanceDays: 30,
        timezone: 'UTC',
      }),
    }
    const todayBooking: Booking = {
      ...BOOKING,
      date: '2026-03-10',
      timeRange: TimeRange.fromHHMM('10:00', '10:30'),
    }
    const repos = createMockRepos({
      booking: todayBooking,
      tenant: zeroAdvanceTenant,
    })
    const useCase = new CancelCustomerBookingUseCase(
      repos.customerRepo,
      repos.bookingRepo,
      repos.tenantRepo
    )

    await useCase.execute({
      authUserId: 'auth-1',
      bookingId: 'booking-1',
      now: new Date('2026-03-10T09:30:00Z'),
    })

    expect(repos.bookingRepo.updateStatus).toHaveBeenCalled()
  })

  it('cancels PENDING bookings too', async () => {
    const pendingBooking: Booking = {
      ...BOOKING,
      status: BookingStatus.PENDING,
    }
    const repos = createMockRepos({ booking: pendingBooking })
    const useCase = new CancelCustomerBookingUseCase(
      repos.customerRepo,
      repos.bookingRepo,
      repos.tenantRepo
    )

    await useCase.execute({
      authUserId: 'auth-1',
      bookingId: 'booking-1',
      now: new Date('2026-03-08T10:00:00Z'),
    })

    expect(repos.bookingRepo.updateStatus).toHaveBeenCalledWith(
      'booking-1',
      BookingStatus.CANCELLED
    )
  })
})
