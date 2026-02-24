'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/infrastructure/supabase/admin-auth'
import { SupabaseBookingRepository } from '@/infrastructure/supabase/booking-repository'
import { BookingStatus } from '@/domain/types'

export async function cancelBooking(id: string): Promise<{ error?: string }> {
  try {
    const { tenant, supabase } = await requireAdmin()
    const bookingRepo = new SupabaseBookingRepository(supabase)
    const booking = await bookingRepo.findById(id)
    if (!booking || booking.tenantId !== tenant.id) {
      return { error: 'Booking not found.' }
    }
    await bookingRepo.updateStatus(id, BookingStatus.CANCELLED)
    revalidatePath('/admin/bookings')
    return {}
  } catch {
    return { error: 'Failed to cancel booking.' }
  }
}
