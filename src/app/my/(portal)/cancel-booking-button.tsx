'use client'

import { useActionState } from 'react'
import { cancelCustomerBooking } from './actions'

interface CancelLabels {
  cancel: string
  cancelling: string
  cancelled: string
}

export function CancelBookingButton({
  bookingId,
  labels,
}: {
  bookingId: string
  labels: CancelLabels
}) {
  const [state, formAction, isPending] = useActionState(cancelCustomerBooking, null)

  if (state?.success) {
    return <span className="text-sm text-slate-400">{labels.cancelled}</span>
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="bookingId" value={bookingId} />
      {state?.error && (
        <span className="text-xs text-rose-500 mr-2">{state.error}</span>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg border border-rose-200 px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition-colors"
      >
        {isPending ? labels.cancelling : labels.cancel}
      </button>
    </form>
  )
}
