'use client'

import { useActionState } from 'react'
import { saveSettings } from './actions'

const COMMON_TIMEZONES = [
  'Europe/Madrid',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Rome',
  'Europe/Lisbon',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Mexico_City',
  'America/Bogota',
  'America/Buenos_Aires',
  'America/Sao_Paulo',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Dubai',
  'Australia/Sydney',
  'Pacific/Auckland',
  'UTC',
]

interface SettingsFormProps {
  name: string
  timezone: string
  minAdvanceMinutes: number
  maxAdvanceDays: number
}

export function SettingsForm({ name, timezone, minAdvanceMinutes, maxAdvanceDays }: SettingsFormProps) {
  const [state, formAction, isPending] = useActionState(saveSettings, null)

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <form action={formAction} className="max-w-md space-y-4">
        {state?.error && (
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-600">
            {state.error}
          </div>
        )}
        {state?.success && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-600">
            Settings saved successfully.
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
            Business name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={name}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="timezone" className="block text-sm font-medium text-slate-700 mb-1.5">
            Timezone
          </label>
          <select
            id="timezone"
            name="timezone"
            defaultValue={timezone}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          >
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="minAdvanceMinutes" className="block text-sm font-medium text-slate-700 mb-1.5">
            Minimum advance time (minutes)
          </label>
          <input
            id="minAdvanceMinutes"
            name="minAdvanceMinutes"
            type="number"
            required
            min={0}
            max={43200}
            defaultValue={minAdvanceMinutes}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
          <p className="mt-1 text-xs text-slate-500">
            How far in advance customers must book. 0 = no minimum.
          </p>
        </div>

        <div>
          <label htmlFor="maxAdvanceDays" className="block text-sm font-medium text-slate-700 mb-1.5">
            Maximum advance booking (days)
          </label>
          <input
            id="maxAdvanceDays"
            name="maxAdvanceDays"
            type="number"
            required
            min={1}
            max={365}
            defaultValue={maxAdvanceDays}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
          <p className="mt-1 text-xs text-slate-500">
            How far ahead customers can book.
          </p>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Saving...' : 'Save settings'}
        </button>
      </form>
    </div>
  )
}
