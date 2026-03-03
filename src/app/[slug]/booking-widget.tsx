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

function ProgressBar({ current }: { current: number }) {
  return (
    <nav aria-label="Booking progress" className="mb-8 flex items-center justify-center">
      {STEP_LABELS.map((label, i) => (
        <div key={i} className="flex items-center">
          {/* Step circle */}
          <div className="flex flex-col items-center">
            <div
              role="img"
              aria-label={`Step ${i + 1}: ${label} — ${i < current ? 'completed' : i === current ? 'current' : 'upcoming'}`}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all duration-500 ${
                i < current
                  ? 'bg-teal-600 text-white'
                  : i === current
                    ? 'bg-teal-600 text-white animate-step-pulse'
                    : 'bg-stone-200 text-stone-500'
              }`}
            >
              {i < current ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <span className={`mt-1.5 text-xs font-medium ${
              i <= current ? 'text-teal-700' : 'text-stone-400'
            }`}>
              {label}
            </span>
          </div>
          {/* Connector bar */}
          {i < STEP_LABELS.length - 1 && (
            <div className="mx-2 mb-5 h-0.5 w-12 sm:w-16 overflow-hidden rounded-full bg-stone-200">
              <div
                className="h-full bg-teal-600 transition-all duration-500"
                style={{ width: i < current ? '100%' : '0%' }}
              />
            </div>
          )}
        </div>
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
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')

  if (!selectedService) {
    return (
      <div className="rounded-2xl border border-warm-border bg-white p-6 shadow-lg">
        <ProgressBar current={0} />
        <h2 className="font-serif text-xl font-semibold text-slate-900 mb-4">Choose a service</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {services.map((service) => (
            <button
              key={service.id}
              onClick={() => setSelectedService(service)}
              className="rounded-xl border-2 border-warm-border p-5 text-left hover:border-teal-500 hover:shadow-md focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 transition-all"
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
      <div className="rounded-2xl border border-warm-border bg-white p-6 shadow-lg">
        <ProgressBar current={1} />
        <button
          onClick={() => setSelectedService(null)}
          aria-label="Go back to service selection"
          className="text-sm text-slate-500 hover:text-slate-900 transition-colors mb-4"
        >
          <span aria-hidden="true">&larr;</span> Change service
        </button>
        <h2 className="font-serif text-xl font-semibold text-slate-900 mb-1">Choose a date</h2>
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
            className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
          />
          <p className="text-xs text-slate-400 mt-1.5">
            Available from {formatReadableDate(minDate)} to {formatReadableDate(maxDate)}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-warm-border bg-white p-6 shadow-lg">
      <ProgressBar current={2} />
      <button
        onClick={() => setSelectedDate('')}
        aria-label="Go back to date selection"
        className="text-sm text-slate-500 hover:text-slate-900 transition-colors mb-4"
      >
        <span aria-hidden="true">&larr;</span> Change date
      </button>
      <h2 className="font-serif text-xl font-semibold text-slate-900 mb-1">Pick a time</h2>
      <p className="text-sm text-slate-500 mb-4">
        {selectedService.name} &middot; {formatReadableDate(selectedDate)}
      </p>
      <SlotPicker
        slug={slug}
        serviceId={selectedService.id}
        serviceName={selectedService.name}
        date={selectedDate}
        onBack={() => setSelectedDate('')}
        customerName={customerName}
        customerEmail={customerEmail}
        customerPhone={customerPhone}
        onCustomerNameChange={setCustomerName}
        onCustomerEmailChange={setCustomerEmail}
        onCustomerPhoneChange={setCustomerPhone}
      />
    </div>
  )
}
