import { describe, it, expect } from 'vitest'
import {
  subtractBookings,
  generateSlots,
  canFitService,
} from './availability-calculator'
import { TimeRange } from '../value-objects/time-range'

describe('subtractBookings', () => {
  const morning = TimeRange.fromHHMM('09:00', '14:00')
  const afternoon = TimeRange.fromHHMM('16:00', '20:00')

  it('returns opening hours when no bookings', () => {
    const result = subtractBookings([morning, afternoon], [])
    expect(result).toHaveLength(2)
    expect(result[0].equals(morning)).toBe(true)
    expect(result[1].equals(afternoon)).toBe(true)
  })

  it('subtracts a single booking from one range', () => {
    const booked = TimeRange.fromHHMM('10:00', '11:00')
    const result = subtractBookings([morning], [booked])
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual(TimeRange.fromHHMM('09:00', '10:00'))
    expect(result[1]).toEqual(TimeRange.fromHHMM('11:00', '14:00'))
  })

  it('subtracts multiple bookings', () => {
    const booking1 = TimeRange.fromHHMM('09:00', '10:00')
    const booking2 = TimeRange.fromHHMM('12:00', '13:00')
    const result = subtractBookings([morning], [booking1, booking2])
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual(TimeRange.fromHHMM('10:00', '12:00'))
    expect(result[1]).toEqual(TimeRange.fromHHMM('13:00', '14:00'))
  })

  it('handles booking spanning across ranges', () => {
    const booked = TimeRange.fromHHMM('13:00', '17:00')
    const result = subtractBookings([morning, afternoon], [booked])
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual(TimeRange.fromHHMM('09:00', '13:00'))
    expect(result[1]).toEqual(TimeRange.fromHHMM('17:00', '20:00'))
  })

  it('returns empty when fully booked', () => {
    const booked = TimeRange.fromHHMM('09:00', '14:00')
    expect(subtractBookings([morning], [booked])).toHaveLength(0)
  })
})

describe('generateSlots', () => {
  it('generates 30-min slots from a single range', () => {
    const range = TimeRange.fromHHMM('09:00', '11:00')
    const slots = generateSlots([range], 30)
    expect(slots).toHaveLength(4)
    expect(slots[0]).toEqual(TimeRange.fromHHMM('09:00', '09:30'))
    expect(slots[1]).toEqual(TimeRange.fromHHMM('09:30', '10:00'))
    expect(slots[2]).toEqual(TimeRange.fromHHMM('10:00', '10:30'))
    expect(slots[3]).toEqual(TimeRange.fromHHMM('10:30', '11:00'))
  })

  it('discards remainder that does not fill a slot', () => {
    const range = TimeRange.fromHHMM('09:00', '10:15')
    expect(generateSlots([range], 30)).toHaveLength(2)
  })

  it('generates slots across multiple ranges', () => {
    const morning = TimeRange.fromHHMM('09:00', '10:00')
    const afternoon = TimeRange.fromHHMM('16:00', '17:00')
    const slots = generateSlots([morning, afternoon], 30)
    expect(slots).toHaveLength(4)
    expect(slots[2]).toEqual(TimeRange.fromHHMM('16:00', '16:30'))
  })

  it('returns empty for ranges shorter than interval', () => {
    const range = TimeRange.fromHHMM('09:00', '09:15')
    expect(generateSlots([range], 30)).toHaveLength(0)
  })
})

describe('canFitService', () => {
  const freeRanges = [
    TimeRange.fromHHMM('09:00', '10:00'), // 60 min gap
    TimeRange.fromHHMM('11:00', '14:00'), // 180 min gap
  ]

  it('returns true when service fits in a free range', () => {
    expect(canFitService(540, 60, freeRanges)).toBe(true)
  })

  it('returns true for service starting mid-range', () => {
    expect(canFitService(660, 120, freeRanges)).toBe(true)
  })

  it('returns false when service overflows free range', () => {
    expect(canFitService(540, 90, freeRanges)).toBe(false)
  })

  it('returns false when starting outside any free range', () => {
    expect(canFitService(600, 30, freeRanges)).toBe(false)
  })

  it('returns true for service exactly filling a range', () => {
    expect(canFitService(540, 60, freeRanges)).toBe(true)
  })

  it('returns false when start + duration exceeds range end', () => {
    expect(canFitService(780, 120, freeRanges)).toBe(false)
  })
})
