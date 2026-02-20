import { TimeRange } from '../value-objects/time-range'

export function subtractBookings(
  openingRanges: TimeRange[],
  bookedRanges: TimeRange[]
): TimeRange[] {
  let free = [...openingRanges]
  for (const booked of bookedRanges) {
    free = free.flatMap((range) => range.subtract(booked))
  }
  return free
}

export function generateSlots(
  ranges: TimeRange[],
  intervalMinutes: number
): TimeRange[] {
  const slots: TimeRange[] = []
  for (const range of ranges) {
    let start = range.start
    while (start + intervalMinutes <= range.end) {
      slots.push(new TimeRange(start, start + intervalMinutes))
      start += intervalMinutes
    }
  }
  return slots
}

export function canFitService(
  startMinute: number,
  durationMinutes: number,
  freeRanges: TimeRange[]
): boolean {
  const needed = new TimeRange(startMinute, startMinute + durationMinutes)
  return freeRanges.some((free) => free.contains(needed))
}
