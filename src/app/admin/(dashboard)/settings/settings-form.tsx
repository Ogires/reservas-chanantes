'use client'

import { useActionState } from 'react'
import { saveSettings } from './actions'
import { BUSINESS_CATEGORIES, CATEGORY_LABELS } from '@/domain/value-objects/business-category'

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
  description: string
  category: string
  city: string
  address: string
  phone: string
  seoTitle: string
  seoDescription: string
}

export function SettingsForm({
  name,
  timezone,
  minAdvanceMinutes,
  maxAdvanceDays,
  description,
  category,
  city,
  address,
  phone,
  seoTitle,
  seoDescription,
}: SettingsFormProps) {
  const [state, formAction, isPending] = useActionState(saveSettings, null)

  const timezoneOptions = COMMON_TIMEZONES.includes(timezone)
    ? COMMON_TIMEZONES
    : [timezone, ...COMMON_TIMEZONES]

  return (
    <div className="rounded-xl border border-[var(--color-warm-border)] bg-white p-6 shadow-sm">
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
            className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
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
            className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
          >
            {timezoneOptions.map((tz) => (
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
            className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
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
            className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
          />
          <p className="mt-1 text-xs text-slate-500">
            How far ahead customers can book.
          </p>
        </div>

        {/* Business Profile */}
        <div className="border-t border-slate-200 pt-4 mt-6">
          <h2 className="text-sm font-semibold text-slate-800 mb-3">Business Profile</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1.5">
                Business category
              </label>
              <select
                id="category"
                name="category"
                defaultValue={category}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
              >
                {BUSINESS_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">
                Used for search engine rich results.
              </p>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1.5">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                maxLength={500}
                rows={3}
                defaultValue={description}
                placeholder="Tell customers about your business..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
              />
              <p className="mt-1 text-xs text-slate-500">
                Shown on your booking page and in search results. Max 500 characters.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-slate-700 mb-1.5">
                  City
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  defaultValue={city}
                  placeholder="e.g. Madrid"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Phone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  defaultValue={phone}
                  placeholder="+34 612 345 678"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1.5">
                Address
              </label>
              <input
                id="address"
                name="address"
                type="text"
                defaultValue={address}
                placeholder="e.g. Calle Gran Via 42"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* SEO Overrides */}
        <div className="border-t border-slate-200 pt-4 mt-6">
          <h2 className="text-sm font-semibold text-slate-800 mb-3">SEO</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="seoTitle" className="block text-sm font-medium text-slate-700 mb-1.5">
                Custom page title
              </label>
              <input
                id="seoTitle"
                name="seoTitle"
                type="text"
                defaultValue={seoTitle}
                placeholder={`Reserva cita en ${name}`}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
              />
              <p className="mt-1 text-xs text-slate-500">
                Leave empty to use the auto-generated title.
              </p>
            </div>

            <div>
              <label htmlFor="seoDescription" className="block text-sm font-medium text-slate-700 mb-1.5">
                Custom meta description
              </label>
              <textarea
                id="seoDescription"
                name="seoDescription"
                maxLength={160}
                rows={2}
                defaultValue={seoDescription}
                placeholder={`Reserva tu cita online en ${name}. Elige servicio, dia y hora disponible.`}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
              />
              <p className="mt-1 text-xs text-slate-500">
                Leave empty to use the auto-generated description. Max 160 characters.
              </p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-teal-600 px-4 py-2.5 font-medium text-white shadow-sm hover:bg-teal-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Saving...' : 'Save settings'}
        </button>
      </form>
    </div>
  )
}
