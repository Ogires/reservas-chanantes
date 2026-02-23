import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/infrastructure/stripe/client'
import { createSupabaseAdmin } from '@/infrastructure/supabase/admin-client'
import { SupabaseBookingRepository } from '@/infrastructure/supabase/booking-repository'
import { BookingStatus } from '@/domain/types'

export async function POST(request: Request) {
  const stripe = getStripe()
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const bookingId = session.metadata?.bookingId

    if (bookingId) {
      const supabase = createSupabaseAdmin()
      const bookingRepo = new SupabaseBookingRepository(supabase)

      const booking = await bookingRepo.findById(bookingId)
      if (booking && booking.status === BookingStatus.PENDING) {
        await bookingRepo.updateStatus(bookingId, BookingStatus.CONFIRMED)
      }
    }
  }

  return NextResponse.json({ received: true })
}
