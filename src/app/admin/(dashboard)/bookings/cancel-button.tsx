'use client'

import { useState } from 'react'
import { cancelBooking } from './actions'

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const [pending, setPending] = useState(false)

  async function handleCancel() {
    if (!confirm('Are you sure you want to cancel this booking?')) return
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
      {pending ? 'Cancelling...' : 'Cancel'}
    </button>
  )
}
