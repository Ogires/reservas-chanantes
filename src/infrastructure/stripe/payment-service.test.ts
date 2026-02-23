import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Money } from '@/domain/value-objects/money'

const mockCreate = vi.fn()

vi.mock('./client', () => ({
  getStripe: () => ({
    checkout: { sessions: { create: mockCreate } },
  }),
}))

import { StripePaymentService } from './payment-service'

describe('StripePaymentService', () => {
  beforeEach(() => {
    mockCreate.mockReset()
  })

  it('creates a checkout session and returns url + id', async () => {
    mockCreate.mockResolvedValue({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/pay/cs_test_123',
    })

    const service = new StripePaymentService()
    const result = await service.createCheckoutSession({
      bookingId: 'booking-1',
      serviceName: 'Corte de pelo',
      price: new Money(1500, 'EUR'),
      customerEmail: 'ana@example.com',
      successUrl:
        'http://localhost:3000/test/booking-success?session_id={CHECKOUT_SESSION_ID}',
      cancelUrl: 'http://localhost:3000/test',
    })

    expect(result.checkoutUrl).toBe(
      'https://checkout.stripe.com/pay/cs_test_123'
    )
    expect(result.sessionId).toBe('cs_test_123')

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        customer_email: 'ana@example.com',
        metadata: { bookingId: 'booking-1' },
        line_items: [
          expect.objectContaining({
            price_data: expect.objectContaining({
              currency: 'eur',
              unit_amount: 1500,
            }),
            quantity: 1,
          }),
        ],
      })
    )
  })

  it('throws when Stripe returns no URL', async () => {
    mockCreate.mockResolvedValue({ id: 'cs_test_456', url: null })

    const service = new StripePaymentService()

    await expect(
      service.createCheckoutSession({
        bookingId: 'booking-2',
        serviceName: 'Tinte',
        price: new Money(3000, 'EUR'),
        customerEmail: 'test@example.com',
        successUrl: 'http://localhost:3000/success',
        cancelUrl: 'http://localhost:3000/cancel',
      })
    ).rejects.toThrow('Stripe did not return a checkout URL')
  })
})
