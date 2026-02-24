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
  timezone: string
}

export function ScheduleEditor({ initialSchedule, timezone }: ScheduleEditorProps) {
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
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500 mb-4">All times in {timezone}</p>
      <form action={formAction}>
        <input type="hidden" name="schedule" value={JSON.stringify(days)} />

        {state?.error && (
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-600 mb-4">
            {state.error}
          </div>
        )}
        {state?.success && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-600 mb-4">
            Schedule saved successfully!
          </div>
        )}

        <div className="space-y-4">
          {ordered.map((day) => (
            <div
              key={day.dayOfWeek}
              className={`rounded-xl border border-slate-200 p-4 ${
                day.open ? 'bg-white' : 'bg-slate-50/50'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <input
                  type="checkbox"
                  checked={day.open}
                  onChange={() => toggleDay(day.dayOfWeek)}
                  id={`day-${day.dayOfWeek}`}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label
                  htmlFor={`day-${day.dayOfWeek}`}
                  className="font-medium text-sm text-slate-900"
                >
                  {day.dayName}
                </label>
                {!day.open && (
                  <span className="text-xs text-slate-400">Closed</span>
                )}
              </div>

              {day.open && (
                <div className="ml-7 space-y-2">
                  {day.ranges.map((range, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="time"
                        value={range.start}
                        onChange={(e) =>
                          updateRange(day.dayOfWeek, i, 'start', e.target.value)
                        }
                        className="rounded-lg border border-slate-300 px-2 py-1 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      />
                      <span className="text-slate-400">-</span>
                      <input
                        type="time"
                        value={range.end}
                        onChange={(e) =>
                          updateRange(day.dayOfWeek, i, 'end', e.target.value)
                        }
                        className="rounded-lg border border-slate-300 px-2 py-1 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      />
                      {day.ranges.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRange(day.dayOfWeek, i)}
                          className="text-rose-500 text-sm hover:text-rose-700 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addRange(day.dayOfWeek)}
                    className="text-indigo-600 text-sm hover:text-indigo-700 transition-colors"
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
          className="mt-6 rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Saving...' : 'Save schedule'}
        </button>
      </form>
    </div>
  )
}
