import type { TenantRepository } from '../ports/tenant-repository'
import type { ScheduleRepository } from '../ports/schedule-repository'
import type { BookingRepository } from '../ports/booking-repository'
import {
  subtractBookings,
  generateSlots,
} from '@/domain/services/availability-calculator'
import { TenantNotFoundError } from '@/domain/errors/domain-errors'
import type { DayOfWeek } from '@/domain/types'

export interface GetAvailabilityInput {
  tenantSlug: string
  date: string // YYYY-MM-DD
}

export interface SlotDTO {
  start: string // HH:MM
  end: string // HH:MM
  available: boolean
}

export interface GetAvailabilityOutput {
  tenantName: string
  date: string
  slots: SlotDTO[]
}

const SLOT_INTERVAL_MINUTES = 30

export class GetAvailabilityUseCase {
  constructor(
    private readonly tenantRepo: TenantRepository,
    private readonly scheduleRepo: ScheduleRepository,
    private readonly bookingRepo: BookingRepository
  ) {}

  async execute(input: GetAvailabilityInput): Promise<GetAvailabilityOutput> {
    const tenant = await this.tenantRepo.findBySlug(input.tenantSlug)
    if (!tenant) throw new TenantNotFoundError(input.tenantSlug)

    const schedule = await this.scheduleRepo.findByTenantId(tenant.id)
    const dayOfWeek = new Date(input.date).getUTCDay() as DayOfWeek
    const daySchedule = schedule?.getDaySchedule(dayOfWeek)

    if (!daySchedule) {
      return { tenantName: tenant.name, date: input.date, slots: [] }
    }

    const bookings = await this.bookingRepo.findByTenantAndDate(
      tenant.id,
      input.date
    )
    const bookedRanges = bookings.map((b) => b.timeRange)
    const freeRanges = subtractBookings(daySchedule.timeRanges, bookedRanges)
    const allSlots = generateSlots(
      daySchedule.timeRanges,
      SLOT_INTERVAL_MINUTES
    )

    const slots: SlotDTO[] = allSlots.map((slot) => {
      const hhmm = slot.toHHMM()
      return {
        start: hhmm.start,
        end: hhmm.end,
        available: freeRanges.some((free) => free.contains(slot)),
      }
    })

    return { tenantName: tenant.name, date: input.date, slots }
  }
}
