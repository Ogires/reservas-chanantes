'use client'

import { useEffect, useState } from 'react'
import { getAvailability, createBooking } from './actions'
import type { SlotDTO } from '@/application/use-cases/get-availability'

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
}: SlotPickerProps) {
  const [slots, setSlots] = useState<SlotDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    getAvailability(slug, date).then((result) => {
      if (result.error) {
        setError(result.error)
      } else {
        setSlots(result.slots)
      }
      setLoading(false)
    })
  }, [slug, date])

  if (loading) {
    return <p className="text-slate-500">Loading available slots...</p>
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
        <p className="text-slate-500 mb-4">
          No available slots on this date. Please choose another date.
        </p>
        <button
          onClick={onBack}
          className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          &larr; Choose another date
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
                    ? 'border-slate-200 bg-white hover:border-indigo-500 hover:bg-indigo-50'
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
        {renderGroup('Morning', morningSlots)}
        {renderGroup('Afternoon', afternoonSlots)}
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
    })

    if (result.success && result.checkoutUrl) {
      window.location.href = result.checkoutUrl
      return
    }
    setError(result.error || 'Booking failed')
    setSubmitting(false)
  }

  return (
    <div>
      <p className="text-sm text-slate-500 mb-4">
        Selected time: <strong className="text-slate-900">{selectedSlot}</strong>{' '}
        <button
          onClick={() => setSelectedSlot(null)}
          className="text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          change
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
            Your name
          </label>
          <input
            id="name"
            type="text"
            required
            value={customerName}
            onChange={(e) => onCustomerNameChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
            Your email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={customerEmail}
            onChange={(e) => onCustomerEmailChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1.5">
            Your phone
          </label>
          <input
            id="phone"
            type="tel"
            required
            autoComplete="tel"
            placeholder="+34 600 123 456"
            value={customerPhone}
            onChange={(e) => onCustomerPhoneChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Redirecting...' : 'Proceed to payment'}
        </button>
      </form>
    </div>
  )
}
