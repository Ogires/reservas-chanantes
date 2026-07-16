'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getAvailability, createBooking } from './actions'
import type { SlotDTO } from '@/application/use-cases/get-availability'
import type { Locale } from '@/domain/types'
import { publicError, type PublicTranslations } from '@/infrastructure/i18n/public-translations'

interface SlotPickerProps {
  slug: string
  serviceId: string
  serviceName: string
  date: string
  onBack: () => void
  customerName: string
  customerEmail: string
  customerPhone: string
  onCustomerNameChange: (value: string) => void
  onCustomerEmailChange: (value: string) => void
  onCustomerPhoneChange: (value: string) => void
  canPayOnline: boolean
  canPayOnSite: boolean
  t: PublicTranslations
  locale: Locale
}

export function SlotPicker({
  slug,
  serviceId,
  serviceName,
  date,
  onBack,
  customerName,
  customerEmail,
  customerPhone,
  onCustomerNameChange,
  onCustomerEmailChange,
  onCustomerPhoneChange,
  canPayOnline,
  canPayOnSite,
  t,
  locale,
}: SlotPickerProps) {
  const readableDate = (() => {
    const [y, m, d] = date.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  })()
  const [slots, setSlots] = useState<SlotDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [payMethod, setPayMethod] = useState<'online' | 'onsite'>(
    canPayOnline ? 'online' : 'onsite'
  )

  useEffect(() => {
    let ignore = false

    void (async () => {
      setLoading(true)
      setError('')
      const result = await getAvailability(slug, date)
      if (ignore) return
      if (result.error) {
        setError(publicError(t, result.error))
      } else {
        setSlots(result.slots)
      }
      setLoading(false)
    })()

    return () => {
      ignore = true
    }
  }, [slug, date, t])

  if (loading) {
    return <p className="text-slate-500">{t.loadingSlots}</p>
  }

  if (error) {
    return (
      <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-600">
        {error}
      </div>
    )
  }

  const availableSlots = slots.filter((s) => s.available)

  if (availableSlots.length === 0) {
    return (
      <div>
        <p className="text-slate-500 mb-4">{t.noSlots}</p>
        <button
          onClick={onBack}
          className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          &larr; {t.chooseAnotherDate}
        </button>
      </div>
    )
  }

  if (!selectedSlot) {
    const morningSlots = slots.filter(
      (s) => parseInt(s.start.split(':')[0], 10) < 12
    )
    const afternoonSlots = slots.filter(
      (s) => parseInt(s.start.split(':')[0], 10) >= 12
    )

    const renderGroup = (label: string, group: SlotDTO[]) => {
      if (group.length === 0) return null
      return (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">
            {label}
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {group.map((slot) => (
              <button
                key={slot.start}
                disabled={!slot.available}
                onClick={() => setSelectedSlot(slot.start)}
                className={`rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all ${
                  slot.available
                    ? 'border-warm-border bg-white hover:border-teal-500 hover:bg-teal-50'
                    : 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300 line-through'
                }`}
              >
                {slot.start}
              </button>
            ))}
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {renderGroup(t.morning, morningSlots)}
        {renderGroup(t.afternoon, afternoonSlots)}
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const result = await createBooking({
      tenantSlug: slug,
      serviceId,
      customerEmail,
      customerName,
      customerPhone,
      date,
      startTime: selectedSlot!,
      paymentMethod: payMethod === 'onsite' ? 'ON_SITE' : 'ONLINE',
    })

    if (result.success && result.checkoutUrl) {
      window.location.href = result.checkoutUrl
      return
    }
    if (result.success) {
      // Pago en el centro: la reserva queda confirmada sin pasar por Stripe.
      setConfirmed(true)
      setSubmitting(false)
      return
    }
    setError(publicError(t, result.error))
    setSubmitting(false)
  }

  if (confirmed) {
    return (
      <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-6 text-center">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100">
          <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="font-serif text-xl font-bold text-emerald-800 mb-1">{t.bookingConfirmed}</h3>
        <p className="text-sm text-emerald-700 mb-1">
          {serviceName} {t.on} {readableDate} {t.at} {selectedSlot}
        </p>
        <p className="text-sm text-emerald-600">{t.payAtVenueNote}</p>
        <div className="mt-5 flex flex-col items-center gap-3">
          <Link
            href={`/${slug}`}
            className="inline-block rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            {t.bookAnother}
          </Link>
          <Link
            href="/my"
            className="text-sm font-medium text-emerald-700 underline hover:text-emerald-900 transition-colors"
          >
            {t.manageBookings}
          </Link>
        </div>
      </div>
    )
  }

  const showPayChoice = canPayOnline && canPayOnSite

  return (
    <div>
      <p className="text-sm text-slate-500 mb-4">
        {t.selectedTime} <strong className="text-slate-900">{selectedSlot}</strong>{' '}
        <button
          onClick={() => setSelectedSlot(null)}
          className="text-teal-600 hover:text-teal-700 transition-colors"
        >
          {t.change}
        </button>
      </p>

      <form onSubmit={handleSubmit} className="max-w-sm space-y-4">
        {error && (
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-600">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
            {t.yourName}
          </label>
          <input
            id="name"
            type="text"
            required
            value={customerName}
            onChange={(e) => onCustomerNameChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
            {t.yourEmail}
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={customerEmail}
            onChange={(e) => onCustomerEmailChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1.5">
            {t.yourPhone}
          </label>
          <input
            id="phone"
            type="tel"
            required
            autoComplete="tel"
            placeholder="+34 600 123 456"
            value={customerPhone}
            onChange={(e) => onCustomerPhoneChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
          />
        </div>

        {showPayChoice && (
          <fieldset className="space-y-2">
            <legend className="block text-sm font-medium text-slate-700 mb-1.5">
              {t.howToPay}
            </legend>
            <label className={`flex items-center gap-3 rounded-lg border-2 px-3 py-2.5 cursor-pointer transition-colors ${
              payMethod === 'online' ? 'border-teal-500 bg-teal-50' : 'border-warm-border hover:border-teal-300'
            }`}>
              <input
                type="radio"
                name="payMethod"
                checked={payMethod === 'online'}
                onChange={() => setPayMethod('online')}
                className="h-4 w-4 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm text-slate-700">{t.payOnline}</span>
            </label>
            <label className={`flex items-center gap-3 rounded-lg border-2 px-3 py-2.5 cursor-pointer transition-colors ${
              payMethod === 'onsite' ? 'border-teal-500 bg-teal-50' : 'border-warm-border hover:border-teal-300'
            }`}>
              <input
                type="radio"
                name="payMethod"
                checked={payMethod === 'onsite'}
                onChange={() => setPayMethod('onsite')}
                className="h-4 w-4 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm text-slate-700">{t.payOnSite}</span>
            </label>
          </fieldset>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-coral px-4 py-2.5 font-medium text-white shadow-sm hover:bg-coral-dark disabled:opacity-50 transition-colors"
        >
          {payMethod === 'onsite'
            ? submitting
              ? t.confirming
              : t.confirmBooking
            : submitting
              ? t.redirecting
              : t.proceedToPayment}
        </button>
      </form>
    </div>
  )
}
