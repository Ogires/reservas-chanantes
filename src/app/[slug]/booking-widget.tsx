'use client'

import { useState } from 'react'
import { SlotPicker } from './slot-picker'

interface ServiceInfo {
  id: string
  name: string
  durationMinutes: number
  priceFormatted: string
}

interface BookingWidgetProps {
  slug: string
  services: ServiceInfo[]
  minDate: string
  maxDate: string
}

const STEP_LABELS = ['Service', 'Date', 'Time'] as const

function StepDots({ current }: { current: number }) {
  return (
    <nav aria-label="Booking progress" className="mb-6 flex items-center justify-center gap-2">
      {STEP_LABELS.map((label, i) => (
        <div
          key={i}
          role="img"
          aria-label={`Step ${i + 1}: ${label} — ${i < current ? 'completed' : i === current ? 'current' : 'upcoming'}`}
          className={`h-2 w-2 rounded-full transition-colors ${
            i <= current ? 'bg-indigo-600' : 'bg-slate-200'
          }`}
        />
      ))}
    </nav>
  )
}

function formatReadableDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function BookingWidget({ slug, services, minDate, maxDate }: BookingWidgetProps) {
  const [selectedService, setSelectedService] = useState<ServiceInfo | null>(
    null
  )
  const [selectedDate, setSelectedDate] = useState('')

  if (!selectedService) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
        <StepDots current={0} />
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Choose a service</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {services.map((service) => (
            <button
              key={service.id}
              onClick={() => setSelectedService(service)}
              className="rounded-xl border-2 border-slate-200 p-5 text-left hover:border-indigo-500 hover:shadow-md focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 transition-all"
            >
              <p className="font-medium text-slate-900">{service.name}</p>
              <p className="mt-1 text-sm text-slate-500">
                {service.durationMinutes} min &middot; {service.priceFormatted}
              </p>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (!selectedDate) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
        <StepDots current={1} />
        <button
          onClick={() => setSelectedService(null)}
          aria-label="Go back to service selection"
          className="text-sm text-slate-500 hover:text-slate-900 transition-colors mb-4"
        >
          <span aria-hidden="true">&larr;</span> Change service
        </button>
        <h2 className="text-xl font-semibold text-slate-900 mb-1">Choose a date</h2>
        <p className="text-sm text-slate-500 mb-4">
          {selectedService.name} &middot; {selectedService.durationMinutes} min
        </p>
        <div>
          <label htmlFor="booking-date" className="block text-sm font-medium text-slate-700 mb-1.5">
            Select a date
          </label>
          <input
            id="booking-date"
            type="date"
            value={selectedDate}
            min={minDate}
            max={maxDate}
            onChange={(e) => {
              const val = e.target.value
              if (val >= minDate && val <= maxDate) {
                setSelectedDate(val)
              }
            }}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
          <p className="text-xs text-slate-400 mt-1.5">
            Available from {formatReadableDate(minDate)} to {formatReadableDate(maxDate)}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
      <StepDots current={2} />
      <button
        onClick={() => setSelectedDate('')}
        aria-label="Go back to date selection"
        className="text-sm text-slate-500 hover:text-slate-900 transition-colors mb-4"
      >
        <span aria-hidden="true">&larr;</span> Change date
      </button>
      <h2 className="text-xl font-semibold text-slate-900 mb-1">Pick a time</h2>
      <p className="text-sm text-slate-500 mb-4">
        {selectedService.name} &middot; {formatReadableDate(selectedDate)}
      </p>
      <SlotPicker
        slug={slug}
        serviceId={selectedService.id}
        serviceName={selectedService.name}
        date={selectedDate}
        onBack={() => setSelectedDate('')}
      />
    </div>
  )
}
