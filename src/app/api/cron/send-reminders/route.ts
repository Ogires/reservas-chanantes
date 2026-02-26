import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/infrastructure/supabase/admin-client'
import { SupabaseBookingRepository } from '@/infrastructure/supabase/booking-repository'
import { SupabaseCustomerRepository } from '@/infrastructure/supabase/customer-repository'
import { SupabaseServiceRepository } from '@/infrastructure/supabase/service-repository'
import { SupabaseTenantRepository } from '@/infrastructure/supabase/tenant-repository'
import { ResendNotificationService } from '@/infrastructure/resend/resend-notification-service'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createSupabaseAdmin()
  const bookingRepo = new SupabaseBookingRepository(supabase)
  const customerRepo = new SupabaseCustomerRepository(supabase)
  const serviceRepo = new SupabaseServiceRepository(supabase)
  const tenantRepo = new SupabaseTenantRepository(supabase)
  const notifications = new ResendNotificationService()

  const tomorrow = new Date()
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  const tomorrowStr = tomorrow.toISOString().slice(0, 10)

  const bookings =
    await bookingRepo.findConfirmedForDateWithoutReminder(tomorrowStr)

  let sent = 0
  for (const booking of bookings) {
    try {
      const [customer, service, tenant] = await Promise.all([
        customerRepo.findById(booking.customerId),
        serviceRepo.findById(booking.serviceId),
        tenantRepo.findById(booking.tenantId),
      ])

      if (customer && service && tenant) {
        await notifications.sendBookingReminder({
          booking,
          customer,
          service,
          tenant,
        })
        sent++
      }

      await bookingRepo.updateReminderSentAt(booking.id, new Date())
    } catch (error) {
      console.error(
        `[send-reminders] Failed for booking ${booking.id}:`,
        error
      )
    }
  }

  return NextResponse.json({ sent, total: bookings.length })
}
