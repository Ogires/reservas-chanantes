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
    const session = await getStripe().checkout.sessions.create({
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
      metadata: {
        bookingId: request.bookingId,
      },
      success_url: request.successUrl,
      cancel_url: request.cancelUrl,
    })

    if (!session.url) {
      throw new Error('Stripe did not return a checkout URL')
    }

    return {
      checkoutUrl: session.url,
      sessionId: session.id,
    }
  }
}
