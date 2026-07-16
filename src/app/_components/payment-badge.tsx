import type { PaymentPresentationKey } from '@/domain/services/payment-presentation'

const COLORS: Record<PaymentPresentationKey, string> = {
  PAID_ONLINE: 'bg-emerald-100 text-emerald-800',
  PENDING_ONLINE: 'bg-amber-100 text-amber-800',
  ON_SITE: 'bg-sky-100 text-sky-800',
}

/** Etiquetas por defecto (inglés). El panel, el portal `/my` y la página de éxito
 *  inyectan sus etiquetas localizadas; este mapa es solo el fallback. */
export const PAYMENT_LABELS_EN: Record<PaymentPresentationKey, string> = {
  PAID_ONLINE: 'Paid online',
  PENDING_ONLINE: 'Payment pending',
  ON_SITE: 'At the venue',
}

/**
 * Badge del estado de pago de una reserva. Las etiquetas se inyectan para poder
 * localizarlas (el panel admin pasa las del tenant); por defecto, inglés.
 */
export function PaymentBadge({
  paymentKey,
  labels = PAYMENT_LABELS_EN,
}: {
  paymentKey: PaymentPresentationKey
  labels?: Record<PaymentPresentationKey, string>
}) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${COLORS[paymentKey]}`}
    >
      {labels[paymentKey]}
    </span>
  )
}
