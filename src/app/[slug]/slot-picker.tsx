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
}

export function SlotPicker({
  slug,
  serviceId,
  serviceName,
  date,
  onBack,
}: SlotPickerProps) {
  const [slots, setSlots] = useState<SlotDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [confirmed, setConfirmed] = useState(false)

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

  if (confirmed) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
        <h3 className="text-lg font-semibold text-green-800 mb-2">
          Booking confirmed!
        </h3>
        <p className="text-sm text-green-700">
          {serviceName} on {date} at {selectedSlot}
        </p>
        <p className="text-sm text-green-700 mt-1">
          A confirmation has been recorded for {customerEmail}.
        </p>
      </div>
    )
  }

  if (loading) {
    return <p className="text-gray-500">Loading available slots...</p>
  }

  if (error) {
    return <p className="text-red-600">{error}</p>
  }

  const availableSlots = slots.filter((s) => s.available)

  if (availableSlots.length === 0) {
    return (
      <div>
        <p className="text-gray-500 mb-4">
          No available slots on this date. Please choose another date.
        </p>
        <button
          onClick={onBack}
          className="text-sm text-blue-600 hover:underline"
        >
          &larr; Choose another date
        </button>
      </div>
    )
  }

  if (!selectedSlot) {
    return (
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
        {slots.map((slot) => (
          <button
            key={slot.start}
            disabled={!slot.available}
            onClick={() => setSelectedSlot(slot.start)}
            className={`rounded border px-3 py-2 text-sm ${
              slot.available
                ? 'hover:border-blue-500 hover:bg-blue-50'
                : 'cursor-not-allowed bg-gray-100 text-gray-400 line-through'
            }`}
          >
            {slot.start}
          </button>
        ))}
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
      date,
      startTime: selectedSlot!,
    })

    if (result.success) {
      setConfirmed(true)
    } else {
      setError(result.error || 'Booking failed')
    }
    setSubmitting(false)
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        Selected time: <strong>{selectedSlot}</strong>{' '}
        <button
          onClick={() => setSelectedSlot(null)}
          className="text-blue-600 hover:underline"
        >
          change
        </button>
      </p>

      <form onSubmit={handleSubmit} className="max-w-sm space-y-4">
        {error && (
          <div className="rounded bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Your name
          </label>
          <input
            id="name"
            type="text"
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full rounded border px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Your email
          </label>
          <input
            id="email"
            type="email"
            required
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            className="w-full rounded border px-3 py-2"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Booking...' : 'Confirm booking'}
        </button>
      </form>
    </div>
  )
}
