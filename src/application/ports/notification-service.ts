import type { Booking } from '@/domain/entities/booking'
import type { Customer } from '@/domain/entities/customer'
import type { Service } from '@/domain/entities/service'
import type { Tenant } from '@/domain/entities/tenant'

export interface BookingEmailData {
  booking: Booking
  customer: Customer
  service: Service
  tenant: Tenant
}

export interface NotificationService {
  sendBookingConfirmation(data: BookingEmailData): Promise<void>
  sendBookingCancellation(data: BookingEmailData): Promise<void>
  sendBookingReminder(data: BookingEmailData): Promise<void>
  sendOwnerNewBooking(data: BookingEmailData, ownerEmail: string): Promise<void>
  sendOwnerCancellation(
    data: BookingEmailData,
    ownerEmail: string
  ): Promise<void>
}
