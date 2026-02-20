import { describe, it, expect } from 'vitest'
import { TimeRange } from './time-range'
import { InvalidTimeRangeError } from '../errors/domain-errors'

describe('TimeRange', () => {
  describe('creation', () => {
    it('creates a valid time range from minutes', () => {
      const range = new TimeRange(540, 840) // 09:00-14:00
      expect(range.start).toBe(540)
      expect(range.end).toBe(840)
    })

    it('throws if start >= end', () => {
      expect(() => new TimeRange(840, 540)).toThrow(InvalidTimeRangeError)
    })

    it('throws if start equals end', () => {
      expect(() => new TimeRange(540, 540)).toThrow(InvalidTimeRangeError)
    })

    it('throws if start < 0', () => {
      expect(() => new TimeRange(-1, 540)).toThrow(InvalidTimeRangeError)
    })

    it('throws if end > 1440', () => {
      expect(() => new TimeRange(540, 1441)).toThrow(InvalidTimeRangeError)
    })
  })

  describe('fromHHMM', () => {
    it('creates range from HH:MM strings', () => {
      const range = TimeRange.fromHHMM('09:00', '14:00')
      expect(range.start).toBe(540)
      expect(range.end).toBe(840)
    })

    it('handles midnight boundary', () => {
      const range = TimeRange.fromHHMM('00:00', '23:59')
      expect(range.start).toBe(0)
      expect(range.end).toBe(1439)
    })
  })

  describe('parseHHMM', () => {
    it('parses HH:MM to minutes from midnight', () => {
      expect(TimeRange.parseHHMM('09:00')).toBe(540)
      expect(TimeRange.parseHHMM('00:00')).toBe(0)
      expect(TimeRange.parseHHMM('23:59')).toBe(1439)
    })
  })

  describe('durationMinutes', () => {
    it('returns duration in minutes', () => {
      expect(new TimeRange(540, 840).durationMinutes).toBe(300)
    })
  })

  describe('toHHMM', () => {
    it('formats start and end as HH:MM', () => {
      expect(new TimeRange(540, 840).toHHMM()).toEqual({
        start: '09:00',
        end: '14:00',
      })
    })

    it('pads single-digit hours and minutes', () => {
      expect(new TimeRange(65, 125).toHHMM()).toEqual({
        start: '01:05',
        end: '02:05',
      })
    })
  })

  describe('overlaps', () => {
    it('detects overlapping ranges', () => {
      const a = new TimeRange(540, 840)
      const b = new TimeRange(600, 900)
      expect(a.overlaps(b)).toBe(true)
      expect(b.overlaps(a)).toBe(true)
    })

    it('adjacent ranges do not overlap', () => {
      const a = new TimeRange(540, 600)
      const b = new TimeRange(600, 660)
      expect(a.overlaps(b)).toBe(false)
    })

    it('non-overlapping ranges', () => {
      const a = new TimeRange(540, 600)
      const b = new TimeRange(660, 720)
      expect(a.overlaps(b)).toBe(false)
    })

    it('contained range overlaps', () => {
      const outer = new TimeRange(540, 840)
      const inner = new TimeRange(600, 780)
      expect(outer.overlaps(inner)).toBe(true)
    })
  })

  describe('contains', () => {
    it('range contains itself', () => {
      const range = new TimeRange(540, 840)
      expect(range.contains(range)).toBe(true)
    })

    it('range contains smaller range inside', () => {
      const outer = new TimeRange(540, 840)
      const inner = new TimeRange(600, 780)
      expect(outer.contains(inner)).toBe(true)
    })

    it('range does not contain overlapping range', () => {
      const a = new TimeRange(540, 840)
      const b = new TimeRange(600, 900)
      expect(a.contains(b)).toBe(false)
    })

    it('range does not contain non-overlapping range', () => {
      const a = new TimeRange(540, 600)
      const b = new TimeRange(660, 720)
      expect(a.contains(b)).toBe(false)
    })
  })

  describe('subtract', () => {
    it('returns original when no overlap', () => {
      const free = new TimeRange(540, 840)
      const booked = new TimeRange(900, 960)
      expect(free.subtract(booked)).toEqual([free])
    })

    it('splits range when booked is in the middle', () => {
      const free = new TimeRange(540, 840)
      const booked = new TimeRange(600, 720)
      const result = free.subtract(booked)
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual(new TimeRange(540, 600))
      expect(result[1]).toEqual(new TimeRange(720, 840))
    })

    it('trims from the start', () => {
      const free = new TimeRange(540, 840)
      const booked = new TimeRange(480, 600)
      const result = free.subtract(booked)
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(new TimeRange(600, 840))
    })

    it('trims from the end', () => {
      const free = new TimeRange(540, 840)
      const booked = new TimeRange(780, 900)
      const result = free.subtract(booked)
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(new TimeRange(540, 780))
    })

    it('returns empty when fully covered', () => {
      const free = new TimeRange(540, 840)
      const booked = new TimeRange(480, 900)
      expect(free.subtract(booked)).toEqual([])
    })

    it('returns empty when exactly matched', () => {
      const free = new TimeRange(540, 840)
      const booked = new TimeRange(540, 840)
      expect(free.subtract(booked)).toEqual([])
    })
  })

  describe('equals', () => {
    it('returns true for same start and end', () => {
      expect(new TimeRange(540, 840).equals(new TimeRange(540, 840))).toBe(
        true
      )
    })

    it('returns false for different ranges', () => {
      expect(new TimeRange(540, 840).equals(new TimeRange(540, 900))).toBe(
        false
      )
    })
  })
})
