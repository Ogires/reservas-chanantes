import type { SupabaseClient } from '@supabase/supabase-js'
import type { BookingEmailData } from '@/application/ports/notification-service'
import { SupabaseBookingRepository } from '@/infrastructure/supabase/booking-repository'
import { SupabaseCustomerRepository } from '@/infrastructure/supabase/customer-repository'
import { SupabaseServiceRepository } from '@/infrastructure/supabase/service-repository'
import { SupabaseTenantRepository } from '@/infrastructure/supabase/tenant-repository'
import { ResendNotificationService } from './resend-notification-service'

async function gatherEmailData(
  supabase: SupabaseClient,
  bookingId: string
): Promise<{ data: BookingEmailData; ownerEmail: string } | null> {
  const bookingRepo = new SupabaseBookingRepository(supabase)
  const customerRepo = new SupabaseCustomerRepository(supabase)
  const serviceRepo = new SupabaseServiceRepository(supabase)
  const tenantRepo = new SupabaseTenantRepository(supabase)

  const booking = await bookingRepo.findById(bookingId)
  if (!booking) return null

  const [customer, service, tenant] = await Promise.all([
    customerRepo.findById(booking.customerId),
    serviceRepo.findById(booking.serviceId),
    tenantRepo.findById(booking.tenantId),
  ])

  if (!customer || !service || !tenant) return null

  const { data: userData } = await supabase.auth.admin.getUserById(
    tenant.ownerId
  )
  const ownerEmail = userData?.user?.email
  if (!ownerEmail) return null

  return { data: { booking, customer, service, tenant }, ownerEmail }
}

const notifications = new ResendNotificationService()

export async function sendConfirmationEmails(
  supabase: SupabaseClient,
  bookingId: string
): Promise<void> {
  const result = await gatherEmailData(supabase, bookingId)
  if (!result) return

  await Promise.all([
    notifications.sendBookingConfirmation(result.data),
    notifications.sendOwnerNewBooking(result.data, result.ownerEmail),
  ])
}

export async function sendCancellationEmails(
  supabase: SupabaseClient,
  bookingId: string
): Promise<void> {
  const result = await gatherEmailData(supabase, bookingId)
  if (!result) return

  await Promise.all([
    notifications.sendBookingCancellation(result.data),
    notifications.sendOwnerCancellation(result.data, result.ownerEmail),
  ])
}
