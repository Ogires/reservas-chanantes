'use client'

import { useActionState } from 'react'
import { deleteService } from '../../actions'

interface DeleteButtonProps {
  serviceId: string
  translations: {
    confirmDelete: string
    deleteService: string
    deleting: string
  }
}

export function DeleteButton({ serviceId, translations: t }: DeleteButtonProps) {
  const [state, formAction, isPending] = useActionState(deleteService, null)

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm(t.confirmDelete)) {
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
        {isPending ? t.deleting : t.deleteService}
      </button>
    </form>
  )
}
