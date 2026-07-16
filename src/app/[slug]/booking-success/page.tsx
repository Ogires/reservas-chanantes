import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type Stripe from 'stripe'
import { getStripe } from '@/infrastructure/stripe/client'
import { createSupabaseAdmin } from '@/infrastructure/supabase/admin-client'
import { SupabaseTenantRepository } from '@/infrastructure/supabase/tenant-repository'
import { SupabaseServiceRepository } from '@/infrastructure/supabase/service-repository'
import { SupabaseBookingRepository } from '@/infrastructure/supabase/booking-repository'
import { PaymentBadge } from '@/app/_components/payment-badge'
import { getPublicTranslations } from '@/infrastructure/i18n/public-translations'

export const metadata: Metadata = {
  robots: { index: false },
}

export default async function BookingSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ session_id?: string }>
}) {
  const { slug } = await params
  const { session_id } = await searchParams

  if (!session_id) notFound()

  // Página pública tras el pago: la reserva se identifica por el bookingId que
  // viene en la metadata de una sesión de Stripe ya verificada. Lectura de
  // servidor de confianza → service-role (la RLS de bookings ya no es pública).
  const supabase = createSupabaseAdmin()
  const tenantRepo = new SupabaseTenantRepository(supabase)
  const tenant = await tenantRepo.findBySlug(slug)
  // La sesion de Checkout vive en la cuenta conectada (cargo directo), asi que
  // hay que recuperarla con el contexto de esa cuenta, no a nivel de plataforma.
  if (!tenant?.stripeAccountId) notFound()

  let session: Stripe.Checkout.Session
  try {
    session = await getStripe().checkout.sessions.retrieve(session_id, {
      stripeAccount: tenant.stripeAccountId,
    })
  } catch {
    notFound()
  }

  const bookingId = session.metadata?.bookingId
  if (!bookingId) notFound()

  const bookingRepo = new SupabaseBookingRepository(supabase)
  const booking = await bookingRepo.findById(bookingId)
  if (!booking) notFound()

  const serviceRepo = new SupabaseServiceRepository(supabase)
  const service = await serviceRepo.findById(booking.serviceId)

  const timeStart = `${String(Math.floor(booking.timeRange.start / 60)).padStart(2, '0')}:${String(booking.timeRange.start % 60).padStart(2, '0')}`

  const t = getPublicTranslations(tenant.defaultLocale)
  const [yy, mm, dd] = booking.date.split('-').map(Number)
  const readableDate = new Date(yy, mm - 1, dd).toLocaleDateString(
    tenant.defaultLocale,
    { month: 'short', day: 'numeric', year: 'numeric' }
  )

  return (
    <div className="min-h-screen bg-warm-bg">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <svg
              className="h-6 w-6 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m4.5 12.75 6 6 9-13.5"
              />
            </svg>
          </div>
          <h1 className="font-serif text-2xl font-bold text-emerald-800 mb-2">
            {t.bookingConfirmed}
          </h1>
          <p className="text-emerald-700 mb-1">
            {service?.name ?? t.stepService} {t.on} {readableDate} {t.at} {timeStart}
          </p>
          <p className="text-sm text-emerald-600">
            {t.confirmationSentTo.replace('{email}', session.customer_email ?? '')}
          </p>

          {/* Estado de pago estático: llegar a esta URL (redirect de Stripe)
              implica que el cobro online se completó, sin depender del webhook. */}
          <div className="mt-3">
            <PaymentBadge paymentKey="PAID_ONLINE" />
          </div>

          <div className="mt-6 flex flex-col items-center gap-3">
            <Link
              href={`/${slug}`}
              className="inline-block rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
            >
              {t.bookAnother}
            </Link>
            <Link
              href="/my"
              className="text-sm font-medium text-emerald-700 underline hover:text-emerald-900 transition-colors"
            >
              {t.manageBookings}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
