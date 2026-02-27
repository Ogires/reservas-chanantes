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

const EN_DATA: BookingEmailData = {
  ...EMAIL_DATA,
  service: { ...EMAIL_DATA.service, name: 'Haircut' },
  tenant: {
    ...EMAIL_DATA.tenant,
    name: 'John Barber',
    defaultLocale: 'en-US',
  },
}

describe('ResendNotificationService', () => {
  const service = new ResendNotificationService()

  beforeEach(() => {
    mockSend.mockReset()
    mockSend.mockResolvedValue({ id: 'msg-1' })
  })

  it('sends booking confirmation to customer (es-ES)', async () => {
    await service.sendBookingConfirmation(EMAIL_DATA)

    expect(mockSend).toHaveBeenCalledOnce()
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'ana@example.com',
        subject: 'Reserva confirmada – Corte de pelo',
      })
    )
  })

  it('sends cancellation to customer (es-ES)', async () => {
    await service.sendBookingCancellation(EMAIL_DATA)

    expect(mockSend).toHaveBeenCalledOnce()
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'ana@example.com',
        subject: 'Reserva cancelada – Corte de pelo',
      })
    )
  })

  it('sends reminder to customer (es-ES)', async () => {
    await service.sendBookingReminder(EMAIL_DATA)

    expect(mockSend).toHaveBeenCalledOnce()
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'ana@example.com',
        subject: 'Recordatorio: Corte de pelo mañana',
      })
    )
  })

  it('sends new booking notification to owner (es-ES)', async () => {
    await service.sendOwnerNewBooking(EMAIL_DATA, 'owner@example.com')

    expect(mockSend).toHaveBeenCalledOnce()
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'owner@example.com',
        subject: 'Nueva reserva: Corte de pelo',
      })
    )
  })

  it('sends cancellation notification to owner (es-ES)', async () => {
    await service.sendOwnerCancellation(EMAIL_DATA, 'owner@example.com')

    expect(mockSend).toHaveBeenCalledOnce()
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'owner@example.com',
        subject: 'Reserva cancelada: Corte de pelo',
      })
    )
  })

  it('does not throw when Resend fails', async () => {
    mockSend.mockRejectedValue(new Error('Resend API error'))

    await expect(
      service.sendBookingConfirmation(EMAIL_DATA)
    ).resolves.toBeUndefined()
  })

  it('includes HTML with localized booking details (es-ES)', async () => {
    await service.sendBookingConfirmation(EMAIL_DATA)

    const html = mockSend.mock.calls[0][0].html as string
    expect(html).toContain('Corte de pelo')
    expect(html).toContain('domingo')
    expect(html).toContain('marzo')
    expect(html).toContain('15,00')
    expect(html).toContain('lang="es-ES"')
    expect(html).toContain('Servicio')
  })

  it('sends confirmation in English for en-US tenant', async () => {
    await service.sendBookingConfirmation(EN_DATA)

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Booking confirmed – Haircut',
      })
    )

    const html = mockSend.mock.calls[0][0].html as string
    expect(html).toContain('lang="en-US"')
    expect(html).toContain('Service')
    expect(html).toContain('Sunday')
    expect(html).toContain('March')
    expect(html).toContain('confirmed')
  })
})
