import Stripe from 'stripe'
import { env } from '@/infrastructure/config/env'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(env.STRIPE_SECRET_KEY!)
  }
  return _stripe
}
