'use client'

import { useState } from 'react'
import { cancelBooking } from './actions'

interface CancelBookingButtonProps {
  bookingId: string
  translations: {
    confirmCancel: string
    cancel: string
    cancelling: string
  }
}

export function CancelBookingButton({ bookingId, translations: t }: CancelBookingButtonProps) {
  const [pending, setPending] = useState(false)

  async function handleCancel() {
    if (!confirm(t.confirmCancel)) return
    setPending(true)
    const result = await cancelBooking(bookingId)
    if (result.error) {
      alert(result.error)
    }
    setPending(false)
  }

  return (
    <button
      onClick={handleCancel}
      disabled={pending}
      className="text-rose-600 hover:text-rose-800 text-sm font-medium disabled:opacity-50 transition-colors"
    >
      {pending ? t.cancelling : t.cancel}
    </button>
  )
}
