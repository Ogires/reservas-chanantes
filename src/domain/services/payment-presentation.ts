import { BookingStatus, PaymentMethod } from '@/domain/types'

export type PaymentPresentationKey = 'PAID_ONLINE' | 'PENDING_ONLINE' | 'ON_SITE'

/**
 * Estado de pago que se muestra al usuario, derivado del método de pago y el
 * estado de la reserva. Devuelve `null` cuando NO procede un indicador —una
 * reserva CANCELADA—: así ninguna superficie (incluidos los emails de
 * cancelación, que comparten `bookingDetails`) pinta un pago engañoso.
 *
 * Invariante: solo el webhook de Stripe (tras el cobro) o la creación on-site
 * ponen una reserva en CONFIRMED; no hay confirmación manual. Por tanto
 * ONLINE + CONFIRMED implica pagado. Una reserva sin `paymentMethod` (datos
 * antiguos) se trata como online, coherente con el valor por defecto en la BD.
 */
export function paymentPresentation(booking: {
  status: BookingStatus
  paymentMethod?: PaymentMethod
}): PaymentPresentationKey | null {
  if (booking.status === BookingStatus.CANCELLED) return null
  const method = booking.paymentMethod ?? PaymentMethod.ONLINE
  if (method === PaymentMethod.ON_SITE) return 'ON_SITE'
  return booking.status === BookingStatus.CONFIRMED
    ? 'PAID_ONLINE'
    : 'PENDING_ONLINE'
}
