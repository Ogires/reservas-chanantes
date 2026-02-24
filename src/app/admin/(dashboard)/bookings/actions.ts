'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/infrastructure/supabase/admin-auth'
import { SupabaseBookingRepository } from '@/infrastructure/supabase/booking-repository'
import { BookingStatus } from '@/domain/types'

export async function cancelBooking(id: string): Promise<{ error?: string }> {
  try {
    const { supabase } = await requireAdmin()
    const bookingRepo = new SupabaseBookingRepository(supabase)
    await bookingRepo.updateStatus(id, BookingStatus.CANCELLED)
    revalidatePath('/admin/bookings')
    return {}
  } catch {
    return { error: 'Failed to cancel booking.' }
  }
}
