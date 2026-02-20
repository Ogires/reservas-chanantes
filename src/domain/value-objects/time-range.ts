import { InvalidTimeRangeError } from '../errors/domain-errors'

export class TimeRange {
  readonly start: number
  readonly end: number

  constructor(start: number, end: number) {
    if (start < 0 || end > 1440 || start >= end) {
      throw new InvalidTimeRangeError(start, end)
    }
    this.start = start
    this.end = end
  }

  static fromHHMM(start: string, end: string): TimeRange {
    return new TimeRange(TimeRange.parseHHMM(start), TimeRange.parseHHMM(end))
  }

  static parseHHMM(time: string): number {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  private static formatMinutes(minutes: number): string {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
  }

  get durationMinutes(): number {
    return this.end - this.start
  }

  toHHMM(): { start: string; end: string } {
    return {
      start: TimeRange.formatMinutes(this.start),
      end: TimeRange.formatMinutes(this.end),
    }
  }

  overlaps(other: TimeRange): boolean {
    return this.start < other.end && other.start < this.end
  }

  contains(other: TimeRange): boolean {
    return this.start <= other.start && this.end >= other.end
  }

  subtract(other: TimeRange): TimeRange[] {
    if (!this.overlaps(other)) return [this]
    const result: TimeRange[] = []
    if (this.start < other.start) {
      result.push(new TimeRange(this.start, other.start))
    }
    if (this.end > other.end) {
      result.push(new TimeRange(other.end, this.end))
    }
    return result
  }

  equals(other: TimeRange): boolean {
    return this.start === other.start && this.end === other.end
  }
}
