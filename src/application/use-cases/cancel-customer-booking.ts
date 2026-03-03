import type { BookingRepository } from '../ports/booking-repository'
import type { CustomerRepository } from '../ports/customer-repository'
import type { TenantRepository } from '../ports/tenant-repository'
import { BookingStatus } from '@/domain/types'
import {
  getTenantLocalDate,
  getTenantLocalMinutes,
} from '@/domain/services/tenant-clock'
import { TimeRange } from '@/domain/value-objects/time-range'
import {
  CustomerNotFoundError,
  BookingNotFoundError,
  BookingAlreadyCancelledError,
  CancellationTooLateError,
} from '@/domain/errors/domain-errors'

export interface CancelCustomerBookingInput {
  authUserId: string
  bookingId: string
  now?: Date
}

export class CancelCustomerBookingUseCase {
  constructor(
    private readonly customerRepo: CustomerRepository,
    private readonly bookingRepo: BookingRepository,
    private readonly tenantRepo: TenantRepository
  ) {}

  async execute(input: CancelCustomerBookingInput): Promise<void> {
    const now = input.now ?? new Date()

    const customer = await this.customerRepo.findByAuthUserId(input.authUserId)
    if (!customer) throw new CustomerNotFoundError(input.authUserId)

    const booking = await this.bookingRepo.findById(input.bookingId)
    if (!booking || booking.customerId !== customer.id) {
      throw new BookingNotFoundError(input.bookingId)
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BookingAlreadyCancelledError(input.bookingId)
    }

    const tenant = await this.tenantRepo.findById(booking.tenantId)
    if (tenant) {
      const { timezone, minAdvanceMinutes } = tenant.bookingPolicy
      const tenantLocalDate = getTenantLocalDate(timezone, now)
      const tenantLocalMinutes = getTenantLocalMinutes(timezone, now)

      if (booking.date === tenantLocalDate) {
        if (booking.timeRange.start < tenantLocalMinutes + minAdvanceMinutes) {
          throw new CancellationTooLateError(minAdvanceMinutes)
        }
      } else if (booking.date < tenantLocalDate) {
        throw new CancellationTooLateError(minAdvanceMinutes)
      }
    }

    await this.bookingRepo.updateStatus(input.bookingId, BookingStatus.CANCELLED)
  }
}
