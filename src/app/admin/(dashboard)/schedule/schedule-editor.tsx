'use client'

import { useActionState, useState } from 'react'
import { saveSchedule } from './actions'

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

interface DayState {
  dayOfWeek: number
  dayName: string
  open: boolean
  ranges: Array<{ start: string; end: string }>
}

interface ScheduleEditorProps {
  initialSchedule: DayState[]
}

export function ScheduleEditor({ initialSchedule }: ScheduleEditorProps) {
  const [days, setDays] = useState<DayState[]>(initialSchedule)
  const [state, formAction, isPending] = useActionState(saveSchedule, null)

  function toggleDay(dayOfWeek: number) {
    setDays((prev) =>
      prev.map((d) =>
        d.dayOfWeek === dayOfWeek
          ? {
              ...d,
              open: !d.open,
              ranges: !d.open && d.ranges.length === 0
                ? [{ start: '09:00', end: '17:00' }]
                : d.ranges,
            }
          : d
      )
    )
  }

  function updateRange(
    dayOfWeek: number,
    index: number,
    field: 'start' | 'end',
    value: string
  ) {
    setDays((prev) =>
      prev.map((d) =>
        d.dayOfWeek === dayOfWeek
          ? {
              ...d,
              ranges: d.ranges.map((r, i) =>
                i === index ? { ...r, [field]: value } : r
              ),
            }
          : d
      )
    )
  }

  function addRange(dayOfWeek: number) {
    setDays((prev) =>
      prev.map((d) =>
        d.dayOfWeek === dayOfWeek
          ? { ...d, ranges: [...d.ranges, { start: '09:00', end: '17:00' }] }
          : d
      )
    )
  }

  function removeRange(dayOfWeek: number, index: number) {
    setDays((prev) =>
      prev.map((d) =>
        d.dayOfWeek === dayOfWeek
          ? { ...d, ranges: d.ranges.filter((_, i) => i !== index) }
          : d
      )
    )
  }

  // Reorder: show Monday-Sunday (1,2,3,4,5,6,0)
  const ordered = [1, 2, 3, 4, 5, 6, 0].map(
    (dow) => days.find((d) => d.dayOfWeek === dow)!
  )

  return (
    <form action={formAction}>
      <input type="hidden" name="schedule" value={JSON.stringify(days)} />

      {state?.error && (
        <div className="rounded bg-red-50 p-3 text-sm text-red-600 mb-4">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="rounded bg-green-50 p-3 text-sm text-green-600 mb-4">
          Schedule saved successfully!
        </div>
      )}

      <div className="space-y-4">
        {ordered.map((day) => (
          <div key={day.dayOfWeek} className="rounded-lg border p-4">
            <div className="flex items-center gap-3 mb-2">
              <input
                type="checkbox"
                checked={day.open}
                onChange={() => toggleDay(day.dayOfWeek)}
                id={`day-${day.dayOfWeek}`}
              />
              <label
                htmlFor={`day-${day.dayOfWeek}`}
                className="font-medium text-sm"
              >
                {day.dayName}
              </label>
              {!day.open && (
                <span className="text-xs text-gray-400">Closed</span>
              )}
            </div>

            {day.open && (
              <div className="ml-6 space-y-2">
                {day.ranges.map((range, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="time"
                      value={range.start}
                      onChange={(e) =>
                        updateRange(day.dayOfWeek, i, 'start', e.target.value)
                      }
                      className="rounded border px-2 py-1 text-sm"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                      type="time"
                      value={range.end}
                      onChange={(e) =>
                        updateRange(day.dayOfWeek, i, 'end', e.target.value)
                      }
                      className="rounded border px-2 py-1 text-sm"
                    />
                    {day.ranges.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRange(day.dayOfWeek, i)}
                        className="text-red-500 text-sm hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addRange(day.dayOfWeek)}
                  className="text-blue-600 text-sm hover:underline"
                >
                  + Add time range
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-6 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? 'Saving...' : 'Save schedule'}
      </button>
    </form>
  )
}
