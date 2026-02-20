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
} from '@/domain/errors/domain-errors'

const TENANT: Tenant = {
  id: 'tenant-1',
  name: 'Peluquería Juan',
  slug: 'peluqueria-juan',
  currency: 'EUR',
  defaultLocale: 'es-ES',
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
  }
  const serviceRepo: ServiceRepository = {
    findById: async () =>
      overrides?.service !== undefined ? overrides.service : SERVICE,
    findByTenantId: async () => [SERVICE],
  }
  const scheduleRepo: ScheduleRepository = {
    findByTenantId: async () =>
      overrides?.schedule !== undefined ? overrides.schedule : SCHEDULE,
  }
  const bookingRepo: BookingRepository = {
    findByTenantAndDate: async () => overrides?.bookings ?? [],
    save: async (b) => b,
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
    date: '2026-02-23', // Monday
    startTime: '09:00',
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
      useCase.execute({ ...validInput, date: '2026-02-22' }) // Sunday
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
    expect(booking.customerId).toBeDefined()
  })
})
