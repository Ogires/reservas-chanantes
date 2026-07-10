'use server'

import { headers } from 'next/headers'
import { createRepositories } from '@/infrastructure/supabase/repositories'
import { GetAvailabilityUseCase } from '@/application/use-cases/get-availability'
import { CreateBookingUseCase } from '@/application/use-cases/create-booking'
import { StripePaymentService } from '@/infrastructure/stripe/payment-service'
import { getCommissionRateBps } from '@/domain/services/plan-limits'
import { DomainError, SlotTakenError } from '@/domain/errors/domain-errors'
import { PaymentMethod } from '@/domain/types'
import { sendConfirmationEmails } from '@/infrastructure/resend/send-booking-emails'
import { createSupabaseAdmin } from '@/infrastructure/supabase/admin-client'
import { bookingLimiter } from '@/infrastructure/security/rate-limiter'
import type { SlotDTO } from '@/application/use-cases/get-availability'

export async function getAvailability(
  tenantSlug: string,
  date: string
): Promise<{ slots: SlotDTO[]; error?: string }> {
  try {
    // Lectura de servidor de confianza (disponibilidad pública / creación de
    // reserva anónima): usa service-role para poder bloquear la RLS de
    // customers/bookings a owner+self sin romper el flujo público.
    const supabase = createSupabaseAdmin()
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
    if (e instanceof DomainError) {
      return { slots: [], error: e.message }
    }
    console.error('[getAvailability] unexpected error:', e)
    return { slots: [], error: 'No se ha podido cargar la disponibilidad' }
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
  paymentMethod?: 'ONLINE' | 'ON_SITE'
}): Promise<{
  success: boolean
  checkoutUrl?: string
  confirmed?: boolean
  error?: string
  slotTaken?: boolean
}> {
  const ip =
    (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!bookingLimiter.check(`booking:${ip}`)) {
    return {
      success: false,
      error: 'Demasiadas peticiones. Inténtalo de nuevo en un minuto.',
    }
  }

  try {
    // Lectura de servidor de confianza (disponibilidad pública / creación de
    // reserva anónima): usa service-role para poder bloquear la RLS de
    // customers/bookings a owner+self sin romper el flujo público.
    const supabase = createSupabaseAdmin()
    const { tenantRepo, serviceRepo, scheduleRepo, bookingRepo, customerRepo } =
      createRepositories(supabase)

    const method =
      input.paymentMethod === 'ON_SITE'
        ? PaymentMethod.ON_SITE
        : PaymentMethod.ONLINE

    // Para el pago online verificamos que el negocio puede cobrar ANTES de
    // crear la reserva: así un negocio sin Stripe no deja una reserva PENDING
    // huérfana que bloquearía el hueco (la restricción de solapamiento solo
    // excluye las canceladas).
    const [tenant, service] = await Promise.all([
      tenantRepo.findBySlug(input.tenantSlug),
      serviceRepo.findById(input.serviceId),
    ])
    if (
      method === PaymentMethod.ONLINE &&
      (!tenant?.stripeAccountId || !tenant.stripeAccountEnabled)
    ) {
      return { success: false, error: 'Payment not configured for this business' }
    }

    const useCase = new CreateBookingUseCase(
      tenantRepo,
      serviceRepo,
      scheduleRepo,
      bookingRepo,
      customerRepo
    )

    const booking = await useCase.execute({
      tenantSlug: input.tenantSlug,
      serviceId: input.serviceId,
      customerEmail: input.customerEmail,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      date: input.date,
      startTime: input.startTime,
      paymentMethod: method,
    })

    // Pago en el centro: la reserva ya queda CONFIRMED (sin Stripe).
    // Enviamos el correo de confirmación de forma best-effort.
    if (method === PaymentMethod.ON_SITE) {
      try {
        await sendConfirmationEmails(createSupabaseAdmin(), booking.id)
      } catch (e) {
        console.error('[createBooking] on-site confirmation email failed:', e)
      }
      return { success: true, confirmed: true }
    }

    // Flujo online: negocio y Stripe ya validados arriba (el servicio lo
    // garantiza el caso de uso). El guard satisface el estrechamiento de tipos.
    if (!service || !tenant?.stripeAccountId) {
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
    if (e instanceof DomainError) {
      return { success: false, error: e.message }
    }
    console.error('[createBooking] unexpected error:', e)
    return {
      success: false,
      error: 'No se ha podido crear la reserva',
    }
  }
}
