import { describe, it, expect } from 'vitest'
import { GetCustomerBookingsUseCase } from './get-customer-bookings'
import type { CustomerRepository } from '../ports/customer-repository'
import type { BookingRepository } from '../ports/booking-repository'
import type { ServiceRepository } from '../ports/service-repository'
import type { TenantRepository } from '../ports/tenant-repository'
import type { Customer } from '@/domain/entities/customer'
import type { Booking } from '@/domain/entities/booking'
import type { Service } from '@/domain/entities/service'
import type { Tenant } from '@/domain/entities/tenant'
import { TimeRange } from '@/domain/value-objects/time-range'
import { Money } from '@/domain/value-objects/money'
import { BookingStatus } from '@/domain/types'
import { createBookingPolicy } from '@/domain/value-objects/booking-policy'
import { CustomerNotFoundError } from '@/domain/errors/domain-errors'

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
  bookingPolicy: createBookingPolicy({}),
  createdAt: new Date('2026-01-01'),
  plan: 'FREE' as const,
  stripeAccountEnabled: false,
} as Tenant

const TENANT_2: Tenant = {
  id: 'tenant-2',
  ownerId: 'owner-2',
  name: 'Barber Shop',
  slug: 'barber-shop',
  currency: 'EUR',
  defaultLocale: 'en-US',
  bookingPolicy: createBookingPolicy({}),
  createdAt: new Date('2026-01-01'),
  plan: 'FREE' as const,
  stripeAccountEnabled: false,
} as Tenant

const SERVICE: Service = {
  id: 'service-1',
  tenantId: 'tenant-1',
  name: 'Corte de pelo',
  durationMinutes: 30,
  price: new Money(1500, 'EUR'),
  active: true,
}

const SERVICE_2: Service = {
  id: 'service-2',
  tenantId: 'tenant-2',
  name: 'Beard trim',
  durationMinutes: 20,
  price: new Money(1000, 'EUR'),
  active: true,
}

const BOOKING_1: Booking = {
  id: 'booking-1',
  tenantId: 'tenant-1',
  serviceId: 'service-1',
  customerId: 'customer-1',
  date: '2026-03-01',
  timeRange: TimeRange.fromHHMM('10:00', '10:30'),
  status: BookingStatus.CONFIRMED,
  createdAt: new Date('2026-02-25'),
}

const BOOKING_2: Booking = {
  id: 'booking-2',
  tenantId: 'tenant-2',
  serviceId: 'service-2',
  customerId: 'customer-1',
  date: '2026-03-05',
  timeRange: TimeRange.fromHHMM('14:00', '14:20'),
  status: BookingStatus.CONFIRMED,
  createdAt: new Date('2026-02-28'),
}

function createMockRepos(overrides?: {
  customer?: Customer | null
  bookings?: Booking[]
  services?: Map<string, Service | null>
  tenants?: Map<string, Tenant | null>
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
    findById: async () => null,
    findByCustomerId: async () => overrides?.bookings ?? [BOOKING_1],
    save: async (b) => b,
    updateStatus: async () => {},
    updateStripeSessionId: async () => {},
    findConfirmedForDateWithoutReminder: async () => [],
    updateReminderSentAt: async () => {},
  }
  const serviceRepo: ServiceRepository = {
    findById: async (id) =>
      overrides?.services ? (overrides.services.get(id) ?? null) : SERVICE,
    findByTenantId: async () => [SERVICE],
    save: async (s) => s,
    update: async (s) => s,
    delete: async () => {},
  }
  const tenantRepo: TenantRepository = {
    findBySlug: async () => TENANT,
    findById: async (id) =>
      overrides?.tenants ? (overrides.tenants.get(id) ?? null) : TENANT,
    findByOwnerId: async () => TENANT,
    save: async (t) => t,
    update: async (t) => t,
    updateStripeAccount: async () => {},
  }
  return { customerRepo, bookingRepo, serviceRepo, tenantRepo }
}

describe('GetCustomerBookingsUseCase', () => {
  it('returns enriched bookings for authenticated customer', async () => {
    const repos = createMockRepos()
    const useCase = new GetCustomerBookingsUseCase(
      repos.customerRepo,
      repos.bookingRepo,
      repos.serviceRepo,
      repos.tenantRepo
    )

    const result = await useCase.execute({ authUserId: 'auth-1' })

    expect(result).toHaveLength(1)
    expect(result[0].booking.id).toBe('booking-1')
    expect(result[0].service?.name).toBe('Corte de pelo')
    expect(result[0].tenant?.name).toBe('Peluquería Juan')
  })

  it('throws CustomerNotFoundError when no customer linked', async () => {
    const repos = createMockRepos({ customer: null })
    const useCase = new GetCustomerBookingsUseCase(
      repos.customerRepo,
      repos.bookingRepo,
      repos.serviceRepo,
      repos.tenantRepo
    )

    await expect(
      useCase.execute({ authUserId: 'unknown' })
    ).rejects.toThrow(CustomerNotFoundError)
  })

  it('returns empty array when customer has no bookings', async () => {
    const repos = createMockRepos({ bookings: [] })
    const useCase = new GetCustomerBookingsUseCase(
      repos.customerRepo,
      repos.bookingRepo,
      repos.serviceRepo,
      repos.tenantRepo
    )

    const result = await useCase.execute({ authUserId: 'auth-1' })

    expect(result).toHaveLength(0)
  })

  it('returns bookings across multiple tenants', async () => {
    const services = new Map<string, Service | null>([
      ['service-1', SERVICE],
      ['service-2', SERVICE_2],
    ])
    const tenants = new Map<string, Tenant | null>([
      ['tenant-1', TENANT],
      ['tenant-2', TENANT_2],
    ])
    const repos = createMockRepos({
      bookings: [BOOKING_1, BOOKING_2],
      services,
      tenants,
    })
    const useCase = new GetCustomerBookingsUseCase(
      repos.customerRepo,
      repos.bookingRepo,
      repos.serviceRepo,
      repos.tenantRepo
    )

    const result = await useCase.execute({ authUserId: 'auth-1' })

    expect(result).toHaveLength(2)
    expect(result[0].tenant?.slug).toBe('peluqueria-juan')
    expect(result[1].tenant?.slug).toBe('barber-shop')
  })

  it('handles deleted services gracefully', async () => {
    const services = new Map<string, Service | null>([
      ['service-1', null],
    ])
    const repos = createMockRepos({ services })
    const useCase = new GetCustomerBookingsUseCase(
      repos.customerRepo,
      repos.bookingRepo,
      repos.serviceRepo,
      repos.tenantRepo
    )

    const result = await useCase.execute({ authUserId: 'auth-1' })

    expect(result).toHaveLength(1)
    expect(result[0].service).toBeNull()
  })

  it('handles deleted tenants gracefully', async () => {
    const tenants = new Map<string, Tenant | null>([
      ['tenant-1', null],
    ])
    const repos = createMockRepos({ tenants })
    const useCase = new GetCustomerBookingsUseCase(
      repos.customerRepo,
      repos.bookingRepo,
      repos.serviceRepo,
      repos.tenantRepo
    )

    const result = await useCase.execute({ authUserId: 'auth-1' })

    expect(result).toHaveLength(1)
    expect(result[0].tenant).toBeNull()
  })

  it('includes cancelled bookings', async () => {
    const cancelledBooking: Booking = {
      ...BOOKING_1,
      status: BookingStatus.CANCELLED,
    }
    const repos = createMockRepos({ bookings: [cancelledBooking] })
    const useCase = new GetCustomerBookingsUseCase(
      repos.customerRepo,
      repos.bookingRepo,
      repos.serviceRepo,
      repos.tenantRepo
    )

    const result = await useCase.execute({ authUserId: 'auth-1' })

    expect(result).toHaveLength(1)
    expect(result[0].booking.status).toBe(BookingStatus.CANCELLED)
  })

  it('preserves booking order from repository', async () => {
    const repos = createMockRepos({ bookings: [BOOKING_2, BOOKING_1] })
    const useCase = new GetCustomerBookingsUseCase(
      repos.customerRepo,
      repos.bookingRepo,
      repos.serviceRepo,
      repos.tenantRepo
    )

    const result = await useCase.execute({ authUserId: 'auth-1' })

    expect(result[0].booking.id).toBe('booking-2')
    expect(result[1].booking.id).toBe('booking-1')
  })
})
