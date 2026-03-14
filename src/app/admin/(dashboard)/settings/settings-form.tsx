'use client'

import { useActionState } from 'react'
import { saveSettings } from './actions'
import { BUSINESS_CATEGORIES } from '@/domain/value-objects/business-category'
import { getCategoryLabels } from '@/domain/value-objects/business-category'
import type { AdminTranslations } from '@/infrastructure/i18n/admin-translations'
import type { Locale } from '@/domain/types'

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
  defaultLocale: Locale
  translations: Pick<AdminTranslations, 'settings' | 'common'>
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
  defaultLocale,
  translations: { settings: t, common },
}: SettingsFormProps) {
  const [state, formAction, isPending] = useActionState(saveSettings, null)

  const timezoneOptions = COMMON_TIMEZONES.includes(timezone)
    ? COMMON_TIMEZONES
    : [timezone, ...COMMON_TIMEZONES]

  const categoryLabels = getCategoryLabels(defaultLocale)

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
            {t.savedSuccess}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
            {t.businessName}
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
          <label htmlFor="defaultLocale" className="block text-sm font-medium text-slate-700 mb-1.5">
            {t.language}
          </label>
          <select
            id="defaultLocale"
            name="defaultLocale"
            defaultValue={defaultLocale}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
          >
            <option value="es-ES">Espanol</option>
            <option value="en-US">English</option>
          </select>
          <p className="mt-1 text-xs text-slate-500">
            {t.languageHelp}
          </p>
        </div>

        <div>
          <label htmlFor="timezone" className="block text-sm font-medium text-slate-700 mb-1.5">
            {t.timezone}
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
            {t.minAdvanceMinutes}
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
            {t.minAdvanceHelp}
          </p>
        </div>

        <div>
          <label htmlFor="maxAdvanceDays" className="block text-sm font-medium text-slate-700 mb-1.5">
            {t.maxAdvanceDays}
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
            {t.maxAdvanceHelp}
          </p>
        </div>

        {/* Business Profile */}
        <div className="border-t border-slate-200 pt-4 mt-6">
          <h2 className="text-sm font-semibold text-slate-800 mb-3">{t.businessProfile}</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1.5">
                {t.businessCategory}
              </label>
              <select
                id="category"
                name="category"
                defaultValue={category}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
              >
                {BUSINESS_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{categoryLabels[cat]}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">
                {t.categoryHelp}
              </p>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1.5">
                {t.description}
              </label>
              <textarea
                id="description"
                name="description"
                maxLength={500}
                rows={3}
                defaultValue={description}
                placeholder={t.descriptionPlaceholder}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
              />
              <p className="mt-1 text-xs text-slate-500">
                {t.descriptionHelp}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-slate-700 mb-1.5">
                  {t.city}
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  defaultValue={city}
                  placeholder={t.cityPlaceholder}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1.5">
                  {t.phone}
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  defaultValue={phone}
                  placeholder={t.phonePlaceholder}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1.5">
                {t.address}
              </label>
              <input
                id="address"
                name="address"
                type="text"
                defaultValue={address}
                placeholder={t.addressPlaceholder}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* SEO Overrides */}
        <div className="border-t border-slate-200 pt-4 mt-6">
          <h2 className="text-sm font-semibold text-slate-800 mb-3">{t.seo}</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="seoTitle" className="block text-sm font-medium text-slate-700 mb-1.5">
                {t.customPageTitle}
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
                {t.pageTitleHelp}
              </p>
            </div>

            <div>
              <label htmlFor="seoDescription" className="block text-sm font-medium text-slate-700 mb-1.5">
                {t.customMetaDescription}
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
                {t.metaDescriptionHelp}
              </p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-teal-600 px-4 py-2.5 font-medium text-white shadow-sm hover:bg-teal-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? common.saving : common.save + ' ' + t.title.toLowerCase()}
        </button>
      </form>
    </div>
  )
}
