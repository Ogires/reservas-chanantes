import type { Money } from '@/domain/value-objects/money'

export interface CreateCheckoutRequest {
  bookingId: string
  serviceName: string
  price: Money
  customerEmail: string
  successUrl: string
  cancelUrl: string
  stripeAccountId: string
  commissionRateBps: number
}

export interface CreateCheckoutResult {
  checkoutUrl: string
  sessionId: string
}

export interface PaymentService {
  createCheckoutSession(
    request: CreateCheckoutRequest
  ): Promise<CreateCheckoutResult>
}
