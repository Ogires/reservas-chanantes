import { describe, it, expect, vi } from 'vitest'
import { CreateBookingUseCase } from './create-booking'
import type { TenantRepository } from '../ports/tenant-repository'
import type { ServiceRepository } from '../ports/service-repository'
import type { ScheduleRepository } from '../ports/schedule-repository'
import type { BookingRepository } from '../ports/booking-repository'
import type { CustomerRepository } from '../ports/customer-repository'
import type { Tenant } from '@/domain/entities/tenant'
import type { Service } from '@/domain/entities/service'
import type { Customer } from '@/domain/entities/customer'
import type { Booking } from '@/domain/entities/booking'
import { WeeklySchedule } from '@/domain/entities/weekly-schedule'
import { TimeRange } from '@/domain/value-objects/time-range'
import { Money } from '@/domain/value-objects/money'
import { DayOfWeek, BookingStatus } from '@/domain/types'
import {
  TenantNotFoundError,
  ServiceNotFoundError,
  ServiceDoesNotFitError,
  BusinessClosedError,
  BookingTooSoonError,
  BookingInPastError,
  BookingTooFarAheadError,
  InvalidPhoneError,
} from '@/domain/errors/domain-errors'
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

const SERVICE: Service = {
  id: 'service-1',
  tenantId: 'tenant-1',
  name: 'Corte de pelo',
  durationMinutes: 30,
  price: new Money(1500, 'EUR'),
  active: true,
}

const CUSTOMER: Customer = {
  id: 'customer-1',
  name: 'Ana García',
  email: 'ana@example.com',
  phone: '600123456',
}

const SCHEDULE = new WeeklySchedule('tenant-1', [
  {
    dayOfWeek: DayOfWeek.MONDAY,
    timeRanges: [TimeRange.fromHHMM('09:00', '14:00')],
  },
])

function createMockRepos(overrides?: {
  tenant?: Tenant | null
  service?: Service | null
  schedule?: WeeklySchedule | null
  bookings?: Booking[]
  customer?: Customer | null
}) {
  const tenantRepo: TenantRepository = {
    findBySlug: async () =>
      overrides?.tenant !== undefined ? overrides.tenant : TENANT,
    findById: async () => TENANT,
    findByOwnerId: async () => TENANT,
    save: async (t) => t,
  }
  const serviceRepo: ServiceRepository = {
    findById: async () =>
      overrides?.service !== undefined ? overrides.service : SERVICE,
    findByTenantId: async () => [SERVICE],
    save: async (s) => s,
    update: async (s) => s,
    delete: async () => {},
  }
  const scheduleRepo: ScheduleRepository = {
    findByTenantId: async () =>
      overrides?.schedule !== undefined ? overrides.schedule : SCHEDULE,
    save: async () => {},
  }
  const bookingRepo: BookingRepository = {
    findByTenantAndDate: async () => overrides?.bookings ?? [],
    findById: async () => null,
    save: async (b) => b,
    updateStatus: async () => {},
    updateStripeSessionId: async () => {},
  }
  const customerRepo: CustomerRepository = {
    findByEmail: async () =>
      overrides?.customer !== undefined ? overrides.customer : CUSTOMER,
    save: async (c) => c,
  }
  return { tenantRepo, serviceRepo, scheduleRepo, bookingRepo, customerRepo }
}

describe('CreateBookingUseCase', () => {
  const validInput = {
    tenantSlug: 'peluqueria-juan',
    serviceId: 'service-1',
    customerEmail: 'ana@example.com',
    customerName: 'Ana García',
    customerPhone: '600123456',
    date: '2026-02-23', // Monday
    startTime: '09:00',
    now: new Date('2026-02-23T00:00:00Z'),
  }

  it('creates a booking successfully', async () => {
    const repos = createMockRepos()
    const useCase = new CreateBookingUseCase(
      repos.tenantRepo,
      repos.serviceRepo,
      repos.scheduleRepo,
      repos.bookingRepo,
      repos.customerRepo
    )

    const booking = await useCase.execute(validInput)

    expect(booking.tenantId).toBe('tenant-1')
    expect(booking.serviceId).toBe('service-1')
    expect(booking.customerId).toBe('customer-1')
    expect(booking.date).toBe('2026-02-23')
    expect(booking.timeRange.start).toBe(540) // 09:00
    expect(booking.timeRange.end).toBe(570) // 09:30
    expect(booking.status).toBe(BookingStatus.PENDING)
  })

  it('throws TenantNotFoundError for unknown tenant', async () => {
    const repos = createMockRepos({ tenant: null })
    const useCase = new CreateBookingUseCase(
      repos.tenantRepo,
      repos.serviceRepo,
      repos.scheduleRepo,
      repos.bookingRepo,
      repos.customerRepo
    )

    await expect(useCase.execute(validInput)).rejects.toThrow(
      TenantNotFoundError
    )
  })

  it('throws ServiceNotFoundError for unknown service', async () => {
    const repos = createMockRepos({ service: null })
    const useCase = new CreateBookingUseCase(
      repos.tenantRepo,
      repos.serviceRepo,
      repos.scheduleRepo,
      repos.bookingRepo,
      repos.customerRepo
    )

    await expect(useCase.execute(validInput)).rejects.toThrow(
      ServiceNotFoundError
    )
  })

  it('throws BusinessClosedError when booking on closed day', async () => {
    const repos = createMockRepos()
    const useCase = new CreateBookingUseCase(
      repos.tenantRepo,
      repos.serviceRepo,
      repos.scheduleRepo,
      repos.bookingRepo,
      repos.customerRepo
    )

    await expect(
      useCase.execute({
        ...validInput,
        date: '2026-02-22', // Sunday
        now: new Date('2026-02-22T00:00:00Z'),
      })
    ).rejects.toThrow(BusinessClosedError)
  })

  it('throws ServiceDoesNotFitError when slot is occupied', async () => {
    const existingBooking: Booking = {
      id: 'existing',
      tenantId: 'tenant-1',
      serviceId: 'service-1',
      customerId: 'c2',
      date: '2026-02-23',
      timeRange: TimeRange.fromHHMM('09:00', '09:30'),
      status: BookingStatus.CONFIRMED,
      createdAt: new Date(),
    }
    const repos = createMockRepos({ bookings: [existingBooking] })
    const useCase = new CreateBookingUseCase(
      repos.tenantRepo,
      repos.serviceRepo,
      repos.scheduleRepo,
      repos.bookingRepo,
      repos.customerRepo
    )

    await expect(useCase.execute(validInput)).rejects.toThrow(
      ServiceDoesNotFitError
    )
  })

  it('creates new customer when email not found', async () => {
    const repos = createMockRepos({ customer: null })
    const saveSpy = vi.spyOn(repos.customerRepo, 'save')
    const useCase = new CreateBookingUseCase(
      repos.tenantRepo,
      repos.serviceRepo,
      repos.scheduleRepo,
      repos.bookingRepo,
      repos.customerRepo
    )

    const booking = await useCase.execute(validInput)

    expect(saveSpy).toHaveBeenCalledOnce()
    expect(saveSpy).toHaveBeenCalledWith(
      expect.objectContaining({ phone: '600123456' })
    )
    expect(booking.customerId).toBeDefined()
  })

  it('throws InvalidPhoneError when phone has fewer than 6 digits', async () => {
    const repos = createMockRepos()
    const useCase = new CreateBookingUseCase(
      repos.tenantRepo,
      repos.serviceRepo,
      repos.scheduleRepo,
      repos.bookingRepo,
      repos.customerRepo
    )

    await expect(
      useCase.execute({ ...validInput, customerPhone: '123' })
    ).rejects.toThrow(InvalidPhoneError)
  })

  it('throws BookingTooSoonError when booking within min advance time', async () => {
    const tenantWithAdvance: Tenant = {
      ...TENANT,
      bookingPolicy: createBookingPolicy({
        minAdvanceMinutes: 120,
        maxAdvanceDays: 365,
        timezone: 'UTC',
      }),
    }
    const repos = createMockRepos({ tenant: tenantWithAdvance })
    const useCase = new CreateBookingUseCase(
      repos.tenantRepo,
      repos.serviceRepo,
      repos.scheduleRepo,
      repos.bookingRepo,
      repos.customerRepo
    )

    // "now" is 08:00 UTC, minAdvance=120 → cutoff 10:00, trying to book 09:00
    const now = new Date('2026-02-23T08:00:00Z')
    await expect(
      useCase.execute({ ...validInput, now })
    ).rejects.toThrow(BookingTooSoonError)
  })

  it('throws BookingInPastError when date is in the past', async () => {
    const repos = createMockRepos()
    const useCase = new CreateBookingUseCase(
      repos.tenantRepo,
      repos.serviceRepo,
      repos.scheduleRepo,
      repos.bookingRepo,
      repos.customerRepo
    )

    // "now" is Feb 23, trying to book Feb 20 (past)
    await expect(
      useCase.execute({
        ...validInput,
        date: '2026-02-20',
        now: new Date('2026-02-23T10:00:00Z'),
      })
    ).rejects.toThrow(BookingInPastError)
  })

  it('throws BookingTooFarAheadError when date exceeds max advance', async () => {
    const tenantShortWindow: Tenant = {
      ...TENANT,
      bookingPolicy: createBookingPolicy({
        minAdvanceMinutes: 0,
        maxAdvanceDays: 7,
        timezone: 'UTC',
      }),
    }
    const repos = createMockRepos({ tenant: tenantShortWindow })
    const useCase = new CreateBookingUseCase(
      repos.tenantRepo,
      repos.serviceRepo,
      repos.scheduleRepo,
      repos.bookingRepo,
      repos.customerRepo
    )

    const now = new Date('2026-02-23T10:00:00Z')
    await expect(
      useCase.execute({ ...validInput, date: '2026-03-23', now })
    ).rejects.toThrow(BookingTooFarAheadError)
  })

  it('allows booking exactly on maxAllowedDate', async () => {
    const tenantShortWindow: Tenant = {
      ...TENANT,
      bookingPolicy: createBookingPolicy({
        minAdvanceMinutes: 0,
        maxAdvanceDays: 7,
        timezone: 'UTC',
      }),
    }
    const repos = createMockRepos({ tenant: tenantShortWindow })
    const useCase = new CreateBookingUseCase(
      repos.tenantRepo,
      repos.serviceRepo,
      repos.scheduleRepo,
      repos.bookingRepo,
      repos.customerRepo
    )

    // Feb 23 + 7 days = March 2 (Monday)
    const now = new Date('2026-02-23T00:00:00Z')
    const booking = await useCase.execute({
      ...validInput,
      date: '2026-03-02', // Monday, exactly 7 days ahead
      now,
    })

    expect(booking.date).toBe('2026-03-02')
  })
})
