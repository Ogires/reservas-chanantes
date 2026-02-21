'use client'

import { useActionState } from 'react'
import { deleteService } from '../../actions'

export function DeleteButton({ serviceId }: { serviceId: string }) {
  const [state, formAction, isPending] = useActionState(deleteService, null)

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm('Are you sure you want to delete this service?')) {
          e.preventDefault()
        }
      }}
    >
      <input type="hidden" name="id" value={serviceId} />
      {state?.error && (
        <p className="text-sm text-rose-600 mb-2">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-rose-700 disabled:opacity-50 transition-colors"
      >
        {isPending ? 'Deleting...' : 'Delete service'}
      </button>
    </form>
  )
}
