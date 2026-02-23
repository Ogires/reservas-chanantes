import { notFound } from 'next/navigation'
import Link from 'next/link'
import type Stripe from 'stripe'
import { getStripe } from '@/infrastructure/stripe/client'
import { createSupabaseServer } from '@/infrastructure/supabase/server'
import { SupabaseTenantRepository } from '@/infrastructure/supabase/tenant-repository'
import { SupabaseServiceRepository } from '@/infrastructure/supabase/service-repository'
import { SupabaseBookingRepository } from '@/infrastructure/supabase/booking-repository'

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

  let session: Stripe.Checkout.Session
  try {
    session = await getStripe().checkout.sessions.retrieve(session_id)
  } catch {
    notFound()
  }

  const bookingId = session.metadata?.bookingId
  if (!bookingId) notFound()

  const supabase = await createSupabaseServer()
  const tenantRepo = new SupabaseTenantRepository(supabase)
  const tenant = await tenantRepo.findBySlug(slug)
  if (!tenant) notFound()

  const bookingRepo = new SupabaseBookingRepository(supabase)
  const booking = await bookingRepo.findById(bookingId)
  if (!booking) notFound()

  const serviceRepo = new SupabaseServiceRepository(supabase)
  const service = await serviceRepo.findById(booking.serviceId)

  const timeStart = `${String(Math.floor(booking.timeRange.start / 60)).padStart(2, '0')}:${String(booking.timeRange.start % 60).padStart(2, '0')}`

  return (
    <div className="min-h-screen bg-white">
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
          <h1 className="text-2xl font-bold text-emerald-800 mb-2">
            Booking confirmed!
          </h1>
          <p className="text-emerald-700 mb-1">
            {service?.name ?? 'Service'} on {booking.date} at {timeStart}
          </p>
          <p className="text-sm text-emerald-600">
            Confirmation sent to {session.customer_email}
          </p>

          <Link
            href={`/${slug}`}
            className="mt-6 inline-block rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            Book another appointment
          </Link>
        </div>
      </div>
    </div>
  )
}
