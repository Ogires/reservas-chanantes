import { describe, it, expect } from 'vitest'
import { paymentPresentation } from './payment-presentation'
import { BookingStatus, PaymentMethod } from '@/domain/types'

describe('paymentPresentation', () => {
  it('online confirmada -> PAID_ONLINE (pagado)', () => {
    expect(
      paymentPresentation({
        status: BookingStatus.CONFIRMED,
        paymentMethod: PaymentMethod.ONLINE,
      })
    ).toBe('PAID_ONLINE')
  })

  it('online pendiente -> PENDING_ONLINE', () => {
    expect(
      paymentPresentation({
        status: BookingStatus.PENDING,
        paymentMethod: PaymentMethod.ONLINE,
      })
    ).toBe('PENDING_ONLINE')
  })

  it('en el centro -> ON_SITE (sea confirmada o pendiente)', () => {
    expect(
      paymentPresentation({
        status: BookingStatus.CONFIRMED,
        paymentMethod: PaymentMethod.ON_SITE,
      })
    ).toBe('ON_SITE')
    expect(
      paymentPresentation({
        status: BookingStatus.PENDING,
        paymentMethod: PaymentMethod.ON_SITE,
      })
    ).toBe('ON_SITE')
  })

  it('cancelada -> null (sin indicador de pago engañoso), online u on-site', () => {
    expect(
      paymentPresentation({
        status: BookingStatus.CANCELLED,
        paymentMethod: PaymentMethod.ONLINE,
      })
    ).toBeNull()
    expect(
      paymentPresentation({
        status: BookingStatus.CANCELLED,
        paymentMethod: PaymentMethod.ON_SITE,
      })
    ).toBeNull()
  })

  it('paymentMethod ausente (reserva antigua) -> se trata como online', () => {
    expect(paymentPresentation({ status: BookingStatus.CONFIRMED })).toBe(
      'PAID_ONLINE'
    )
    expect(paymentPresentation({ status: BookingStatus.PENDING })).toBe(
      'PENDING_ONLINE'
    )
  })
})
