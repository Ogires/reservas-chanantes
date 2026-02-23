import type { TenantRepository } from '../ports/tenant-repository'
import type { ServiceRepository } from '../ports/service-repository'
import type { ScheduleRepository } from '../ports/schedule-repository'
import type { BookingRepository } from '../ports/booking-repository'
import type { CustomerRepository } from '../ports/customer-repository'
import type { Booking } from '@/domain/entities/booking'
import { TimeRange } from '@/domain/value-objects/time-range'
import {
  subtractBookings,
  canFitService,
} from '@/domain/services/availability-calculator'
import {
  getTenantLocalDate,
  getTenantLocalMinutes,
  addDaysToLocalDate,
} from '@/domain/services/tenant-clock'
import { BookingStatus, type DayOfWeek } from '@/domain/types'
import {
  TenantNotFoundError,
  ServiceNotFoundError,
  BusinessClosedError,
  ServiceDoesNotFitError,
  BookingTooSoonError,
  BookingInPastError,
  BookingTooFarAheadError,
} from '@/domain/errors/domain-errors'

export interface CreateBookingInput {
  tenantSlug: string
  serviceId: string
  customerEmail: string
  customerName: string
  date: string // YYYY-MM-DD
  startTime: string // HH:MM
  now?: Date
}

export class CreateBookingUseCase {
  constructor(
    private readonly tenantRepo: TenantRepository,
    private readonly serviceRepo: ServiceRepository,
    private readonly scheduleRepo: ScheduleRepository,
    private readonly bookingRepo: BookingRepository,
    private readonly customerRepo: CustomerRepository
  ) {}

  async execute(input: CreateBookingInput): Promise<Booking> {
    const now = input.now ?? new Date()
    const tenant = await this.tenantRepo.findBySlug(input.tenantSlug)
    if (!tenant) throw new TenantNotFoundError(input.tenantSlug)

    const { timezone, minAdvanceMinutes, maxAdvanceDays } =
      tenant.bookingPolicy
    const tenantLocalDate = getTenantLocalDate(timezone, now)
    const tenantLocalMinutes = getTenantLocalMinutes(timezone, now)
    const maxAllowedDate = addDaysToLocalDate(tenantLocalDate, maxAdvanceDays)

    if (input.date > maxAllowedDate) {
      throw new BookingTooFarAheadError(maxAdvanceDays)
    }
    if (input.date < tenantLocalDate) {
      throw new BookingInPastError(input.date)
    }

    const startMinute = TimeRange.parseHHMM(input.startTime)

    if (input.date === tenantLocalDate) {
      if (startMinute < tenantLocalMinutes + minAdvanceMinutes) {
        throw new BookingTooSoonError(minAdvanceMinutes)
      }
    }

    const service = await this.serviceRepo.findById(input.serviceId)
    if (!service || service.tenantId !== tenant.id) {
      throw new ServiceNotFoundError(input.serviceId)
    }

    const schedule = await this.scheduleRepo.findByTenantId(tenant.id)
    const dayOfWeek = new Date(input.date).getUTCDay() as DayOfWeek
    const daySchedule = schedule?.getDaySchedule(dayOfWeek)
    if (!daySchedule) throw new BusinessClosedError(input.date)

    const existingBookings = await this.bookingRepo.findByTenantAndDate(
      tenant.id,
      input.date
    )
    const bookedRanges = existingBookings.map((b) => b.timeRange)
    const freeRanges = subtractBookings(daySchedule.timeRanges, bookedRanges)

    if (!canFitService(startMinute, service.durationMinutes, freeRanges)) {
      throw new ServiceDoesNotFitError(service.durationMinutes, input.startTime)
    }

    let customer = await this.customerRepo.findByEmail(input.customerEmail)
    if (!customer) {
      customer = await this.customerRepo.save({
        id: crypto.randomUUID(),
        name: input.customerName,
        email: input.customerEmail,
      })
    }

    const booking: Booking = {
      id: crypto.randomUUID(),
      tenantId: tenant.id,
      serviceId: service.id,
      customerId: customer.id,
      date: input.date,
      timeRange: new TimeRange(
        startMinute,
        startMinute + service.durationMinutes
      ),
      status: BookingStatus.PENDING,
      createdAt: new Date(),
    }

    return this.bookingRepo.save(booking)
  }
}
