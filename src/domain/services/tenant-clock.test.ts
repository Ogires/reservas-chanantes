import { describe, it, expect } from 'vitest'
import {
  getTenantLocalDate,
  getTenantLocalMinutes,
  addDaysToLocalDate,
} from './tenant-clock'

describe('getTenantLocalDate', () => {
  it('returns correct date for UTC', () => {
    // 2026-03-15 at 10:00 UTC
    const now = new Date('2026-03-15T10:00:00Z')
    expect(getTenantLocalDate('UTC', now)).toBe('2026-03-15')
  })

  it('handles timezone where date is ahead of UTC', () => {
    // 2026-03-15 23:30 UTC → 2026-03-16 in Asia/Tokyo (+9)
    const now = new Date('2026-03-15T23:30:00Z')
    expect(getTenantLocalDate('Asia/Tokyo', now)).toBe('2026-03-16')
  })

  it('handles timezone where date is behind UTC', () => {
    // 2026-03-16 01:00 UTC → 2026-03-15 in America/New_York (-5 in March)
    const now = new Date('2026-03-16T01:00:00Z')
    expect(getTenantLocalDate('America/New_York', now)).toBe('2026-03-15')
  })
})

describe('getTenantLocalMinutes', () => {
  it('returns minutes from midnight for UTC', () => {
    // 14:30 UTC = 870 minutes
    const now = new Date('2026-03-15T14:30:00Z')
    expect(getTenantLocalMinutes('UTC', now)).toBe(870)
  })

  it('returns 0 at midnight', () => {
    const now = new Date('2026-03-15T00:00:00Z')
    expect(getTenantLocalMinutes('UTC', now)).toBe(0)
  })

  it('adjusts for timezone offset', () => {
    // 10:00 UTC → 11:00 in Europe/Madrid (CET, +1 in March before DST)
    const now = new Date('2026-03-15T10:00:00Z')
    const minutes = getTenantLocalMinutes('Europe/Madrid', now)
    expect(minutes).toBe(660) // 11:00 = 660 minutes
  })
})

describe('addDaysToLocalDate', () => {
  it('adds days correctly', () => {
    expect(addDaysToLocalDate('2026-03-15', 5)).toBe('2026-03-20')
  })

  it('handles month boundary', () => {
    expect(addDaysToLocalDate('2026-03-30', 5)).toBe('2026-04-04')
  })

  it('handles year boundary', () => {
    expect(addDaysToLocalDate('2026-12-30', 5)).toBe('2027-01-04')
  })

  it('handles adding zero days', () => {
    expect(addDaysToLocalDate('2026-03-15', 0)).toBe('2026-03-15')
  })

  it('handles February in non-leap year', () => {
    expect(addDaysToLocalDate('2026-02-26', 5)).toBe('2026-03-03')
  })
})
