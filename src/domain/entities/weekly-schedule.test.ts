import { describe, it, expect } from 'vitest'
import { WeeklySchedule, type DaySchedule } from './weekly-schedule'
import { TimeRange } from '../value-objects/time-range'
import { DayOfWeek } from '../types'

describe('WeeklySchedule', () => {
  const mondaySchedule: DaySchedule = {
    dayOfWeek: DayOfWeek.MONDAY,
    timeRanges: [
      TimeRange.fromHHMM('09:00', '14:00'),
      TimeRange.fromHHMM('16:00', '20:00'),
    ],
  }

  const tuesdaySchedule: DaySchedule = {
    dayOfWeek: DayOfWeek.TUESDAY,
    timeRanges: [TimeRange.fromHHMM('09:00', '14:00')],
  }

  it('creates a schedule with given days', () => {
    const schedule = new WeeklySchedule('tenant-1', [
      mondaySchedule,
      tuesdaySchedule,
    ])
    expect(schedule.tenantId).toBe('tenant-1')
  })

  describe('getDaySchedule', () => {
    it('returns schedule for a configured day', () => {
      const schedule = new WeeklySchedule('tenant-1', [
        mondaySchedule,
        tuesdaySchedule,
      ])
      const monday = schedule.getDaySchedule(DayOfWeek.MONDAY)
      expect(monday).toBeDefined()
      expect(monday!.timeRanges).toHaveLength(2)
    })

    it('returns null for unconfigured day (closed)', () => {
      const schedule = new WeeklySchedule('tenant-1', [mondaySchedule])
      expect(schedule.getDaySchedule(DayOfWeek.SUNDAY)).toBeNull()
    })
  })

  describe('isOpenOn', () => {
    it('returns true for configured day', () => {
      const schedule = new WeeklySchedule('tenant-1', [mondaySchedule])
      expect(schedule.isOpenOn(DayOfWeek.MONDAY)).toBe(true)
    })

    it('returns false for unconfigured day', () => {
      const schedule = new WeeklySchedule('tenant-1', [mondaySchedule])
      expect(schedule.isOpenOn(DayOfWeek.SUNDAY)).toBe(false)
    })
  })
})
