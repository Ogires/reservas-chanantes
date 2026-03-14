'use client'

import { useActionState } from 'react'
import { saveService } from './actions'
import type { AdminTranslations } from '@/infrastructure/i18n/admin-translations'

interface ServiceFormProps {
  service?: {
    id: string
    name: string
    durationMinutes: number
    priceEur: number
    active: boolean
  }
  translations: Pick<AdminTranslations, 'services' | 'common'>
}

export function ServiceForm({ service, translations: { services: t, common } }: ServiceFormProps) {
  const [state, formAction, isPending] = useActionState(saveService, null)

  return (
    <div className="rounded-xl border border-[var(--color-warm-border)] bg-white p-6 shadow-sm">
      <form action={formAction} className="max-w-md space-y-4">
        {state?.error && (
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-600">
            {state.error}
          </div>
        )}

        {service && <input type="hidden" name="id" value={service.id} />}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
            {t.serviceName}
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={service?.name}
            placeholder={t.serviceNamePlaceholder}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
          />
        </div>

        <div>
          <label
            htmlFor="durationMinutes"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            {t.duration}
          </label>
          <input
            id="durationMinutes"
            name="durationMinutes"
            type="number"
            required
            min={1}
            step={1}
            defaultValue={service?.durationMinutes ?? 30}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="price" className="block text-sm font-medium text-slate-700 mb-1.5">
            {t.price}
          </label>
          <input
            id="price"
            name="price"
            type="number"
            required
            min={0}
            step={0.01}
            defaultValue={service?.priceEur ?? 0}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="active"
            name="active"
            type="checkbox"
            defaultChecked={service?.active ?? true}
            className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
          />
          <label htmlFor="active" className="text-sm font-medium text-slate-700">
            {t.activeLabel}
          </label>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-teal-600 px-4 py-2.5 font-medium text-white shadow-sm hover:bg-teal-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? common.saving : service ? t.updateService : t.createService}
        </button>
      </form>
    </div>
  )
}
