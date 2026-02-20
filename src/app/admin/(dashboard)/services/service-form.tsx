'use client'

import { useActionState } from 'react'
import { saveService } from './actions'

interface ServiceFormProps {
  service?: {
    id: string
    name: string
    durationMinutes: number
    priceEur: number
    active: boolean
  }
}

export function ServiceForm({ service }: ServiceFormProps) {
  const [state, formAction, isPending] = useActionState(saveService, null)

  return (
    <form action={formAction} className="max-w-md space-y-4">
      {state?.error && (
        <div className="rounded bg-red-50 p-3 text-sm text-red-600">
          {state.error}
        </div>
      )}

      {service && <input type="hidden" name="id" value={service.id} />}

      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Service name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={service?.name}
          placeholder="e.g. Corte de pelo"
          className="w-full rounded border px-3 py-2"
        />
      </div>

      <div>
        <label
          htmlFor="durationMinutes"
          className="block text-sm font-medium mb-1"
        >
          Duration (minutes)
        </label>
        <input
          id="durationMinutes"
          name="durationMinutes"
          type="number"
          required
          min={1}
          step={1}
          defaultValue={service?.durationMinutes ?? 30}
          className="w-full rounded border px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="price" className="block text-sm font-medium mb-1">
          Price (EUR)
        </label>
        <input
          id="price"
          name="price"
          type="number"
          required
          min={0}
          step={0.01}
          defaultValue={service?.priceEur ?? 0}
          className="w-full rounded border px-3 py-2"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="active"
          name="active"
          type="checkbox"
          defaultChecked={service?.active ?? true}
        />
        <label htmlFor="active" className="text-sm font-medium">
          Active (visible to customers)
        </label>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? 'Saving...' : service ? 'Update service' : 'Create service'}
      </button>
    </form>
  )
}
