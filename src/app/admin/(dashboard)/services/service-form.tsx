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
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <form action={formAction} className="max-w-md space-y-4">
        {state?.error && (
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-600">
            {state.error}
          </div>
        )}

        {service && <input type="hidden" name="id" value={service.id} />}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
            Service name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={service?.name}
            placeholder="e.g. Corte de pelo"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
        </div>

        <div>
          <label
            htmlFor="durationMinutes"
            className="block text-sm font-medium text-slate-700 mb-1.5"
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
            className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="price" className="block text-sm font-medium text-slate-700 mb-1.5">
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
            className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="active"
            name="active"
            type="checkbox"
            defaultChecked={service?.active ?? true}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="active" className="text-sm font-medium text-slate-700">
            Active (visible to customers)
          </label>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Saving...' : service ? 'Update service' : 'Create service'}
        </button>
      </form>
    </div>
  )
}
