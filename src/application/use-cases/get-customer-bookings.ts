import type { BookingRepository } from '../ports/booking-repository'
import type { CustomerRepository } from '../ports/customer-repository'
import type { ServiceRepository } from '../ports/service-repository'
import type { TenantRepository } from '../ports/tenant-repository'
import type { Booking } from '@/domain/entities/booking'
import type { Service } from '@/domain/entities/service'
import type { Tenant } from '@/domain/entities/tenant'
import { CustomerNotFoundError } from '@/domain/errors/domain-errors'

export interface EnrichedBooking {
  booking: Booking
  service: Service | null
  tenant: Tenant | null
}

export interface GetCustomerBookingsInput {
  authUserId: string
}

export class GetCustomerBookingsUseCase {
  constructor(
    private readonly customerRepo: CustomerRepository,
    private readonly bookingRepo: BookingRepository,
    private readonly serviceRepo: ServiceRepository,
    private readonly tenantRepo: TenantRepository
  ) {}

  async execute(input: GetCustomerBookingsInput): Promise<EnrichedBooking[]> {
    const customer = await this.customerRepo.findByAuthUserId(input.authUserId)
    if (!customer) throw new CustomerNotFoundError(input.authUserId)

    const bookings = await this.bookingRepo.findByCustomerId(customer.id)

    const enriched = await Promise.all(
      bookings.map(async (booking) => {
        const [service, tenant] = await Promise.all([
          this.serviceRepo.findById(booking.serviceId),
          this.tenantRepo.findById(booking.tenantId),
        ])
        return { booking, service, tenant }
      })
    )

    return enriched
  }
}
