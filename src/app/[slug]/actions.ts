'use server'

import { createSupabaseServer } from '@/infrastructure/supabase/server'
import { createRepositories } from '@/infrastructure/supabase/repositories'
import { GetAvailabilityUseCase } from '@/application/use-cases/get-availability'
import { CreateBookingUseCase } from '@/application/use-cases/create-booking'
import type { SlotDTO } from '@/application/use-cases/get-availability'

export async function getAvailability(
  tenantSlug: string,
  date: string
): Promise<{ slots: SlotDTO[]; error?: string }> {
  try {
    const supabase = await createSupabaseServer()
    const { tenantRepo, scheduleRepo, bookingRepo } =
      createRepositories(supabase)

    const useCase = new GetAvailabilityUseCase(
      tenantRepo,
      scheduleRepo,
      bookingRepo
    )

    const result = await useCase.execute({ tenantSlug, date })
    return { slots: result.slots }
  } catch (e) {
    return {
      slots: [],
      error: e instanceof Error ? e.message : 'Failed to get availability',
    }
  }
}

export async function createBooking(input: {
  tenantSlug: string
  serviceId: string
  customerEmail: string
  customerName: string
  date: string
  startTime: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseServer()
    const { tenantRepo, serviceRepo, scheduleRepo, bookingRepo, customerRepo } =
      createRepositories(supabase)

    const useCase = new CreateBookingUseCase(
      tenantRepo,
      serviceRepo,
      scheduleRepo,
      bookingRepo,
      customerRepo
    )

    await useCase.execute(input)
    return { success: true }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to create booking',
    }
  }
}
