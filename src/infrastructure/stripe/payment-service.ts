import type {
  PaymentService,
  CreateCheckoutRequest,
  CreateCheckoutResult,
} from '@/application/ports/payment-service'
import { getStripe } from './client'

export class StripePaymentService implements PaymentService {
  async createCheckoutSession(
    request: CreateCheckoutRequest
  ): Promise<CreateCheckoutResult> {
    const feeAmount = Math.round(
      (request.price.amountCents * request.commissionRateBps) / 10000
    )

    const session = await getStripe().checkout.sessions.create(
      {
        mode: 'payment',
        customer_email: request.customerEmail,
        line_items: [
          {
            price_data: {
              currency: request.price.currency.toLowerCase(),
              unit_amount: request.price.amountCents,
              product_data: {
                name: request.serviceName,
              },
            },
            quantity: 1,
          },
        ],
        payment_intent_data: {
          application_fee_amount: feeAmount,
        },
        metadata: {
          bookingId: request.bookingId,
        },
        success_url: request.successUrl,
        cancel_url: request.cancelUrl,
      },
      { stripeAccount: request.stripeAccountId }
    )

    if (!session.url) {
      throw new Error('Stripe did not return a checkout URL')
    }

    return {
      checkoutUrl: session.url,
      sessionId: session.id,
    }
  }
}
