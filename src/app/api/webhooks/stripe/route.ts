import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/infrastructure/stripe/client'
import { createSupabaseAdmin } from '@/infrastructure/supabase/admin-client'
import { SupabaseTenantRepository } from '@/infrastructure/supabase/tenant-repository'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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

  if (event.type === 'account.updated') {
    const account = event.data.object as Stripe.Account
    const supabase = createSupabaseAdmin()
    const tenantRepo = new SupabaseTenantRepository(supabase)
    await tenantRepo.updateStripeAccountEnabled(
      account.id,
      account.charges_enabled ?? false
    )
  }

  return NextResponse.json({ received: true })
}
