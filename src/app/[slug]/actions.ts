'use server'

import { headers } from 'next/headers'
import { createSupabaseServer } from '@/infrastructure/supabase/server'
import { createRepositories } from '@/infrastructure/supabase/repositories'
import { GetAvailabilityUseCase } from '@/application/use-cases/get-availability'
import { CreateBookingUseCase } from '@/application/use-cases/create-booking'
import { StripePaymentService } from '@/infrastructure/stripe/payment-service'
import { getCommissionRateBps } from '@/domain/services/plan-limits'
import { SlotTakenError } from '@/domain/errors/domain-errors'
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
  customerPhone: string
  date: string
  startTime: string
}): Promise<{
  success: boolean
  checkoutUrl?: string
  error?: string
  slotTaken?: boolean
}> {
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

    const [service, tenant] = await Promise.all([
      serviceRepo.findById(input.serviceId),
      tenantRepo.findBySlug(input.tenantSlug),
    ])
    if (!service) {
      return { success: false, error: 'Service not found' }
    }
    if (!tenant?.stripeAccountId || !tenant.stripeAccountEnabled) {
      return { success: false, error: 'Payment not configured for this business' }
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
      stripeAccountId: tenant.stripeAccountId,
      commissionRateBps: getCommissionRateBps(tenant.plan),
    })

    await bookingRepo.updateStripeSessionId(booking.id, checkout.sessionId)

    return { success: true, checkoutUrl: checkout.checkoutUrl }
  } catch (e) {
    if (e instanceof SlotTakenError) {
      return {
        success: false,
        error: 'Ese hueco se acaba de ocupar. Elige otro.',
        slotTaken: true,
      }
    }
    console.error('[createBooking] unexpected error:', e)
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to create booking',
    }
  }
}
