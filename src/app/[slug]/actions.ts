'use server'

import { headers } from 'next/headers'
import { createSupabaseServer } from '@/infrastructure/supabase/server'
import { createRepositories } from '@/infrastructure/supabase/repositories'
import { GetAvailabilityUseCase } from '@/application/use-cases/get-availability'
import { CreateBookingUseCase } from '@/application/use-cases/create-booking'
import { StripePaymentService } from '@/infrastructure/stripe/payment-service'
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
}): Promise<{ success: boolean; checkoutUrl?: string; error?: string }> {
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

    const booking = await useCase.execute(input)

    const service = await serviceRepo.findById(input.serviceId)
    if (!service) {
      return { success: false, error: 'Service not found' }
    }

    const hdrs = await headers()
    const host = hdrs.get('host') ?? 'localhost:3000'
    const protocol = hdrs.get('x-forwarded-proto') ?? 'http'
    const origin = `${protocol}://${host}`

    const successUrl = `${origin}/${input.tenantSlug}/booking-success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${origin}/${input.tenantSlug}`

    const paymentService = new StripePaymentService()
    const checkout = await paymentService.createCheckoutSession({
      bookingId: booking.id,
      serviceName: service.name,
      price: service.price,
      customerEmail: input.customerEmail,
      successUrl,
      cancelUrl,
    })

    await bookingRepo.updateStripeSessionId(booking.id, checkout.sessionId)

    return { success: true, checkoutUrl: checkout.checkoutUrl }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to create booking',
    }
  }
}
