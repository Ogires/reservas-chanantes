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

export function BookingWidget({ slug, services }: BookingWidgetProps) {
  const [selectedService, setSelectedService] = useState<ServiceInfo | null>(
    null
  )
  const [selectedDate, setSelectedDate] = useState('')

  const today = new Date().toISOString().split('T')[0]

  if (!selectedService) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-4">Choose a service</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {services.map((service) => (
            <button
              key={service.id}
              onClick={() => setSelectedService(service)}
              className="rounded-lg border p-4 text-left hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <p className="font-medium">{service.name}</p>
              <p className="text-sm text-gray-500">
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
      <div>
        <button
          onClick={() => setSelectedService(null)}
          className="text-sm text-blue-600 hover:underline mb-4"
        >
          &larr; Change service
        </button>
        <h2 className="text-xl font-semibold mb-1">Choose a date</h2>
        <p className="text-sm text-gray-500 mb-4">
          {selectedService.name} &middot; {selectedService.durationMinutes} min
        </p>
        <input
          type="date"
          min={today}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="rounded border px-3 py-2"
        />
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={() => setSelectedDate('')}
        className="text-sm text-blue-600 hover:underline mb-4"
      >
        &larr; Change date
      </button>
      <h2 className="text-xl font-semibold mb-1">Pick a time</h2>
      <p className="text-sm text-gray-500 mb-4">
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
