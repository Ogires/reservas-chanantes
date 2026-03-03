'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServer } from '@/infrastructure/supabase/server'
import { SupabaseCustomerRepository } from '@/infrastructure/supabase/customer-repository'
import { SupabaseBookingRepository } from '@/infrastructure/supabase/booking-repository'
import { SupabaseTenantRepository } from '@/infrastructure/supabase/tenant-repository'
import { CancelCustomerBookingUseCase } from '@/application/use-cases/cancel-customer-booking'

export async function cancelCustomerBooking(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const bookingId = formData.get('bookingId') as string

  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const useCase = new CancelCustomerBookingUseCase(
    new SupabaseCustomerRepository(supabase),
    new SupabaseBookingRepository(supabase),
    new SupabaseTenantRepository(supabase)
  )

  try {
    await useCase.execute({
      authUserId: user.id,
      bookingId,
    })
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to cancel' }
  }

  revalidatePath('/my')
  revalidatePath('/my/history')
  return { success: true }
}
