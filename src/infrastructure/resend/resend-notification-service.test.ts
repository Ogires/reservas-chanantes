import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { BookingEmailData } from '@/application/ports/notification-service'
import { TimeRange } from '@/domain/value-objects/time-range'
import { Money } from '@/domain/value-objects/money'
import { BookingStatus } from '@/domain/types'
import { createBookingPolicy } from '@/domain/value-objects/booking-policy'

const mockSend = vi.fn()

vi.mock('./client', () => ({
  getResend: () => ({
    emails: { send: mockSend },
  }),
}))

import { ResendNotificationService } from './resend-notification-service'

const EMAIL_DATA: BookingEmailData = {
  booking: {
    id: 'booking-1',
    tenantId: 'tenant-1',
    serviceId: 'service-1',
    customerId: 'customer-1',
    date: '2026-03-01',
    timeRange: TimeRange.fromHHMM('10:00', '10:30'),
    status: BookingStatus.CONFIRMED,
    createdAt: new Date('2026-02-25'),
  },
  customer: {
    id: 'customer-1',
    name: 'Ana García',
    email: 'ana@example.com',
    phone: '600123456',
  },
  service: {
    id: 'service-1',
    tenantId: 'tenant-1',
    name: 'Corte de pelo',
    durationMinutes: 30,
    price: new Money(1500, 'EUR'),
    active: true,
  },
  tenant: {
    id: 'tenant-1',
    ownerId: 'owner-1',
    name: 'Peluquería Juan',
    slug: 'peluqueria-juan',
    currency: 'EUR',
    defaultLocale: 'es-ES',
    bookingPolicy: createBookingPolicy({}),
    createdAt: new Date('2026-01-01'),
  },
}

describe('ResendNotificationService', () => {
  const service = new ResendNotificationService()

  beforeEach(() => {
    mockSend.mockReset()
    mockSend.mockResolvedValue({ id: 'msg-1' })
  })

  it('sends booking confirmation to customer', async () => {
    await service.sendBookingConfirmation(EMAIL_DATA)

    expect(mockSend).toHaveBeenCalledOnce()
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'ana@example.com',
        subject: 'Booking confirmed – Corte de pelo',
      })
    )
  })

  it('sends cancellation to customer', async () => {
    await service.sendBookingCancellation(EMAIL_DATA)

    expect(mockSend).toHaveBeenCalledOnce()
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'ana@example.com',
        subject: 'Booking cancelled – Corte de pelo',
      })
    )
  })

  it('sends reminder to customer', async () => {
    await service.sendBookingReminder(EMAIL_DATA)

    expect(mockSend).toHaveBeenCalledOnce()
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'ana@example.com',
        subject: 'Reminder: Corte de pelo tomorrow',
      })
    )
  })

  it('sends new booking notification to owner', async () => {
    await service.sendOwnerNewBooking(EMAIL_DATA, 'owner@example.com')

    expect(mockSend).toHaveBeenCalledOnce()
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'owner@example.com',
        subject: 'New booking: Corte de pelo',
      })
    )
  })

  it('sends cancellation notification to owner', async () => {
    await service.sendOwnerCancellation(EMAIL_DATA, 'owner@example.com')

    expect(mockSend).toHaveBeenCalledOnce()
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'owner@example.com',
        subject: 'Booking cancelled: Corte de pelo',
      })
    )
  })

  it('does not throw when Resend fails', async () => {
    mockSend.mockRejectedValue(new Error('Resend API error'))

    await expect(
      service.sendBookingConfirmation(EMAIL_DATA)
    ).resolves.toBeUndefined()
  })

  it('includes HTML with booking details', async () => {
    await service.sendBookingConfirmation(EMAIL_DATA)

    const html = mockSend.mock.calls[0][0].html as string
    expect(html).toContain('Corte de pelo')
    expect(html).toContain('2026-03-01')
    expect(html).toContain('10:00')
    expect(html).toContain('15.00 €')
  })
})
