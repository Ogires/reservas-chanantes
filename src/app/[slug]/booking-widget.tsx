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
}

function StepDots({ current }: { current: number }) {
  return (
    <div className="mb-6 flex items-center justify-center gap-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`h-2 w-2 rounded-full transition-colors ${
            i <= current ? 'bg-indigo-600' : 'bg-slate-200'
          }`}
        />
      ))}
    </div>
  )
}

export function BookingWidget({ slug, services }: BookingWidgetProps) {
  const [selectedService, setSelectedService] = useState<ServiceInfo | null>(
    null
  )
  const [selectedDate, setSelectedDate] = useState('')

  const today = new Date().toISOString().split('T')[0]

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
              className="rounded-xl border-2 border-slate-200 p-5 text-left hover:border-indigo-500 hover:shadow-md transition-all"
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
          className="text-sm text-slate-500 hover:text-slate-900 transition-colors mb-4"
        >
          &larr; Change service
        </button>
        <h2 className="text-xl font-semibold text-slate-900 mb-1">Choose a date</h2>
        <p className="text-sm text-slate-500 mb-4">
          {selectedService.name} &middot; {selectedService.durationMinutes} min
        </p>
        <input
          type="date"
          min={today}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
        />
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
      <StepDots current={2} />
      <button
        onClick={() => setSelectedDate('')}
        className="text-sm text-slate-500 hover:text-slate-900 transition-colors mb-4"
      >
        &larr; Change date
      </button>
      <h2 className="text-xl font-semibold text-slate-900 mb-1">Pick a time</h2>
      <p className="text-sm text-slate-500 mb-4">
        {selectedService.name} &middot; {selectedDate}
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
