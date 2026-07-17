# Reservas Chanantes — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Project:** `reservas-chanantes`

**Goal:** Build the core domain and application layers of a B2B2C booking SaaS, demonstrating Clean Architecture and TDD for the TFM.

**Architecture:** Clean Architecture — Domain (entities, value objects, domain services), Application (use cases, port interfaces), Infrastructure (Supabase repos, Stripe), Presentation (Next.js App Router, React). All domain logic is framework-independent and thoroughly tested.

**Tech Stack:** Next.js 16 (App Router), TypeScript (strict), Supabase (PostgreSQL + Auth + RLS), Stripe Connect, Vitest (unit/integration), Playwright (E2E).

---

## Phase 1: Project Foundation

### Task 1: Create Next.js Project

**Files:**
- Create: `package.json` (generated)
- Create: `tsconfig.json` (generated)
- Create: `src/app/layout.tsx` (generated)
- Create: `src/app/page.tsx` (generated)

**Step 1: Scaffold Next.js project**

```bash
npx create-next-app@latest reservas-chanantes --typescript --eslint --tailwind --app --src-dir --import-alias "@/*" --use-npm
```

If interactive prompts appear: TypeScript=Yes, ESLint=Yes, Tailwind=Yes, `src/`=Yes, App Router=Yes, Turbopack=Yes, Import alias=`@/*`.

**Step 2: Enable TypeScript strict mode**

Verify `tsconfig.json` has `"strict": true` (should be default). If not, add it.

**Step 3: Verify project runs**

```bash
cd booking-saas && npm run dev
```

Expected: Dev server starts on localhost:3000.

**Step 4: Commit**

```bash
git init && git add -A && git commit -m "chore: scaffold Next.js project with TypeScript strict"
```

---

### Task 2: Install and Configure Vitest

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

**Step 1: Install Vitest and dependencies**

```bash
npm install -D vitest @vitejs/plugin-react vite-tsconfig-paths
```

**Step 2: Create Vitest configuration**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/domain/**', 'src/application/**'],
    },
  },
})
```

**Step 3: Add test scripts to package.json**

Add to `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

**Step 4: Create a smoke test**

Create `src/smoke.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'

describe('smoke test', () => {
  it('works', () => {
    expect(1 + 1).toBe(2)
  })
})
```

**Step 5: Run to verify setup**

Run: `npm test`
Expected: 1 test passes.

**Step 6: Commit**

```bash
git add vitest.config.ts src/smoke.test.ts package.json package-lock.json
git commit -m "chore: configure Vitest with TypeScript path aliases"
```

---

### Task 3: Create Folder Structure and Shared Types

**Files:**
- Create: `src/domain/value-objects/` (directory)
- Create: `src/domain/entities/` (directory)
- Create: `src/domain/services/` (directory)
- Create: `src/domain/errors/domain-errors.ts`
- Create: `src/domain/types.ts`
- Create: `src/application/ports/` (directory)
- Create: `src/application/use-cases/` (directory)
- Create: `src/infrastructure/` (directory)

**Step 1: Create directory structure**

```bash
mkdir -p src/domain/{value-objects,entities,services,errors}
mkdir -p src/application/{ports,use-cases}
mkdir -p src/infrastructure/{supabase,stripe}
```

**Step 2: Create shared domain types**

Create `src/domain/types.ts`:

```typescript
export type Currency = 'EUR' | 'USD' | 'GBP'

export type Locale = 'es-ES' | 'en-US'

export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}
```

**Step 3: Create domain error classes**

Create `src/domain/errors/domain-errors.ts`:

```typescript
export class DomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
  }
}

export class InvalidTimeRangeError extends DomainError {
  constructor(start: number, end: number) {
    super(
      `Invalid time range: ${start}-${end}. Start must be < end, both in [0, 1440].`
    )
  }
}

export class InvalidMoneyError extends DomainError {
  constructor(message: string) {
    super(message)
  }
}

export class InvalidSlugError extends DomainError {
  constructor(slug: string) {
    super(
      `Invalid slug: "${slug}". Must be lowercase alphanumeric with hyphens, 3-60 chars.`
    )
  }
}

export class TenantNotFoundError extends DomainError {
  constructor(identifier: string) {
    super(`Tenant not found: "${identifier}"`)
  }
}

export class ServiceNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Service not found: "${id}"`)
  }
}

export class ScheduleNotFoundError extends DomainError {
  constructor(tenantId: string) {
    super(`Schedule not found for tenant: "${tenantId}"`)
  }
}

export class BusinessClosedError extends DomainError {
  constructor(date: string) {
    super(`Business is closed on ${date}`)
  }
}

export class BookingConflictError extends DomainError {
  constructor(message: string) {
    super(message)
  }
}

export class ServiceDoesNotFitError extends DomainError {
  constructor(serviceDuration: number, startTime: string) {
    super(`Service (${serviceDuration}min) does not fit starting at ${startTime}`)
  }
}
```

**Step 4: Delete smoke test**

```bash
rm src/smoke.test.ts
```

**Step 5: Commit**

```bash
git add src/domain/ src/application/ src/infrastructure/
git rm src/smoke.test.ts
git commit -m "chore: create Clean Architecture folder structure and shared types"
```

---

## Phase 2: Domain Value Objects (TDD)

### Task 4: TimeRange Value Object

**Files:**
- Create: `src/domain/value-objects/time-range.ts`
- Create: `src/domain/value-objects/time-range.test.ts`

**Step 1: Write failing tests**

Create `src/domain/value-objects/time-range.test.ts`:

```typescript
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

  describe('parseHHMM (static)', () => {
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
      expect(new TimeRange(540, 840).equals(new TimeRange(540, 840))).toBe(true)
    })

    it('returns false for different ranges', () => {
      expect(new TimeRange(540, 840).equals(new TimeRange(540, 900))).toBe(false)
    })
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/domain/value-objects/time-range.test.ts`
Expected: FAIL — Cannot find module `./time-range`.

**Step 3: Implement TimeRange**

Create `src/domain/value-objects/time-range.ts`:

```typescript
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
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- src/domain/value-objects/time-range.test.ts`
Expected: All tests PASS.

**Step 5: Commit**

```bash
git add src/domain/value-objects/time-range.ts src/domain/value-objects/time-range.test.ts
git commit -m "feat(domain): add TimeRange value object with full TDD"
```

---

### Task 5: Money Value Object

**Files:**
- Create: `src/domain/value-objects/money.ts`
- Create: `src/domain/value-objects/money.test.ts`

**Step 1: Write failing tests**

Create `src/domain/value-objects/money.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { Money } from './money'
import { InvalidMoneyError } from '../errors/domain-errors'

describe('Money', () => {
  it('creates money with amount in cents and currency', () => {
    const money = new Money(1500, 'EUR')
    expect(money.amountCents).toBe(1500)
    expect(money.currency).toBe('EUR')
  })

  it('throws for negative amount', () => {
    expect(() => new Money(-1, 'EUR')).toThrow(InvalidMoneyError)
  })

  it('throws for non-integer amount', () => {
    expect(() => new Money(15.5, 'EUR')).toThrow(InvalidMoneyError)
  })

  describe('format', () => {
    it('formats EUR', () => {
      expect(new Money(1550, 'EUR').format()).toBe('15.50 €')
    })

    it('formats USD', () => {
      expect(new Money(1550, 'USD').format()).toBe('$15.50')
    })

    it('formats zero', () => {
      expect(new Money(0, 'EUR').format()).toBe('0.00 €')
    })
  })

  describe('equals', () => {
    it('returns true for same amount and currency', () => {
      expect(new Money(1500, 'EUR').equals(new Money(1500, 'EUR'))).toBe(true)
    })

    it('returns false for different amount', () => {
      expect(new Money(1500, 'EUR').equals(new Money(2000, 'EUR'))).toBe(false)
    })

    it('returns false for different currency', () => {
      expect(new Money(1500, 'EUR').equals(new Money(1500, 'USD'))).toBe(false)
    })
  })
})
```

**Step 2: Run to verify fail**

Run: `npm test -- src/domain/value-objects/money.test.ts`
Expected: FAIL.

**Step 3: Implement Money**

Create `src/domain/value-objects/money.ts`:

```typescript
import { InvalidMoneyError } from '../errors/domain-errors'
import type { Currency } from '../types'

const CURRENCY_FORMATS: Record<Currency, (amount: string) => string> = {
  EUR: (a) => `${a} €`,
  USD: (a) => `$${a}`,
  GBP: (a) => `£${a}`,
}

export class Money {
  readonly amountCents: number
  readonly currency: Currency

  constructor(amountCents: number, currency: Currency) {
    if (amountCents < 0 || !Number.isInteger(amountCents)) {
      throw new InvalidMoneyError(
        `Amount must be a non-negative integer (cents). Got: ${amountCents}`
      )
    }
    this.amountCents = amountCents
    this.currency = currency
  }

  format(): string {
    const decimal = (this.amountCents / 100).toFixed(2)
    return CURRENCY_FORMATS[this.currency](decimal)
  }

  equals(other: Money): boolean {
    return (
      this.amountCents === other.amountCents && this.currency === other.currency
    )
  }
}
```

**Step 4: Run to verify pass**

Run: `npm test -- src/domain/value-objects/money.test.ts`
Expected: All PASS.

**Step 5: Commit**

```bash
git add src/domain/value-objects/money.ts src/domain/value-objects/money.test.ts
git commit -m "feat(domain): add Money value object with TDD"
```

---

### Task 6: Slug Value Object

**Files:**
- Create: `src/domain/value-objects/slug.ts`
- Create: `src/domain/value-objects/slug.test.ts`

**Step 1: Write failing tests**

Create `src/domain/value-objects/slug.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { Slug } from './slug'
import { InvalidSlugError } from '../errors/domain-errors'

describe('Slug', () => {
  it('creates a valid slug', () => {
    const slug = new Slug('peluqueria-juan')
    expect(slug.value).toBe('peluqueria-juan')
  })

  it('throws for slug shorter than 3 chars', () => {
    expect(() => new Slug('ab')).toThrow(InvalidSlugError)
  })

  it('throws for slug longer than 60 chars', () => {
    expect(() => new Slug('a'.repeat(61))).toThrow(InvalidSlugError)
  })

  it('throws for uppercase characters', () => {
    expect(() => new Slug('Peluqueria')).toThrow(InvalidSlugError)
  })

  it('throws for spaces', () => {
    expect(() => new Slug('my shop')).toThrow(InvalidSlugError)
  })

  it('throws for special characters', () => {
    expect(() => new Slug('my_shop!')).toThrow(InvalidSlugError)
  })

  it('allows hyphens and numbers', () => {
    expect(new Slug('salon-123').value).toBe('salon-123')
  })

  describe('fromName', () => {
    it('generates slug from business name', () => {
      expect(Slug.fromName('Peluquería Juan').value).toBe('peluqueria-juan')
    })

    it('handles multiple spaces', () => {
      expect(Slug.fromName('Mi   Negocio   Bonito').value).toBe(
        'mi-negocio-bonito'
      )
    })

    it('removes accents', () => {
      expect(Slug.fromName('Café María').value).toBe('cafe-maria')
    })
  })

  describe('equals', () => {
    it('returns true for same value', () => {
      expect(new Slug('abc').equals(new Slug('abc'))).toBe(true)
    })

    it('returns false for different value', () => {
      expect(new Slug('abc').equals(new Slug('def'))).toBe(false)
    })
  })
})
```

**Step 2: Run to verify fail**

Run: `npm test -- src/domain/value-objects/slug.test.ts`
Expected: FAIL.

**Step 3: Implement Slug**

Create `src/domain/value-objects/slug.ts`:

```typescript
import { InvalidSlugError } from '../errors/domain-errors'

const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/

export class Slug {
  readonly value: string

  constructor(value: string) {
    if (value.length < 3 || value.length > 60 || !SLUG_REGEX.test(value)) {
      throw new InvalidSlugError(value)
    }
    this.value = value
  }

  static fromName(name: string): Slug {
    const slug = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
    return new Slug(slug)
  }

  equals(other: Slug): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}
```

**Step 4: Run to verify pass**

Run: `npm test -- src/domain/value-objects/slug.test.ts`
Expected: All PASS.

**Step 5: Commit**

```bash
git add src/domain/value-objects/slug.ts src/domain/value-objects/slug.test.ts
git commit -m "feat(domain): add Slug value object with TDD"
```

---

## Phase 3: Domain Entities

### Task 7: Core Entity Types

**Files:**
- Create: `src/domain/entities/tenant.ts`
- Create: `src/domain/entities/service.ts`
- Create: `src/domain/entities/customer.ts`
- Create: `src/domain/entities/booking.ts`

These are data-carrying interfaces — no complex behavior, rely on already-tested value objects.

**Step 1: Create Tenant entity**

Create `src/domain/entities/tenant.ts`:

```typescript
import type { Currency, Locale } from '../types'

export interface Tenant {
  readonly id: string
  readonly name: string
  readonly slug: string
  readonly currency: Currency
  readonly defaultLocale: Locale
  readonly createdAt: Date
}
```

**Step 2: Create Service entity**

Create `src/domain/entities/service.ts`:

```typescript
import type { Money } from '../value-objects/money'

export interface Service {
  readonly id: string
  readonly tenantId: string
  readonly name: string
  readonly durationMinutes: number
  readonly price: Money
  readonly active: boolean
}
```

**Step 3: Create Customer entity**

Create `src/domain/entities/customer.ts`:

```typescript
export interface Customer {
  readonly id: string
  readonly name: string
  readonly email: string
  readonly phone?: string
}
```

**Step 4: Create Booking entity**

Create `src/domain/entities/booking.ts`:

```typescript
import type { BookingStatus } from '../types'
import type { TimeRange } from '../value-objects/time-range'

export interface Booking {
  readonly id: string
  readonly tenantId: string
  readonly serviceId: string
  readonly customerId: string
  readonly date: string // YYYY-MM-DD
  readonly timeRange: TimeRange
  readonly status: BookingStatus
  readonly createdAt: Date
}
```

**Step 5: Commit**

```bash
git add src/domain/entities/
git commit -m "feat(domain): add Tenant, Service, Customer, Booking entity types"
```

---

### Task 8: WeeklySchedule Entity (TDD)

**Files:**
- Create: `src/domain/entities/weekly-schedule.ts`
- Create: `src/domain/entities/weekly-schedule.test.ts`

**Step 1: Write failing tests**

Create `src/domain/entities/weekly-schedule.test.ts`:

```typescript
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
```

**Step 2: Run to verify fail**

Run: `npm test -- src/domain/entities/weekly-schedule.test.ts`
Expected: FAIL.

**Step 3: Implement WeeklySchedule**

Create `src/domain/entities/weekly-schedule.ts`:

```typescript
import type { DayOfWeek } from '../types'
import type { TimeRange } from '../value-objects/time-range'

export interface DaySchedule {
  readonly dayOfWeek: DayOfWeek
  readonly timeRanges: TimeRange[]
}

export class WeeklySchedule {
  readonly tenantId: string
  private readonly days: Map<DayOfWeek, DaySchedule>

  constructor(tenantId: string, schedules: DaySchedule[]) {
    this.tenantId = tenantId
    this.days = new Map(schedules.map((s) => [s.dayOfWeek, s]))
  }

  getDaySchedule(day: DayOfWeek): DaySchedule | null {
    return this.days.get(day) ?? null
  }

  isOpenOn(day: DayOfWeek): boolean {
    return this.days.has(day)
  }
}
```

**Step 4: Run to verify pass**

Run: `npm test -- src/domain/entities/weekly-schedule.test.ts`
Expected: All PASS.

**Step 5: Commit**

```bash
git add src/domain/entities/weekly-schedule.ts src/domain/entities/weekly-schedule.test.ts
git commit -m "feat(domain): add WeeklySchedule entity with TDD"
```

---

## Phase 4: Domain Services — Core Algorithm (TDD)

### Task 9: AvailabilityCalculator — subtractBookings

**Files:**
- Create: `src/domain/services/availability-calculator.ts`
- Create: `src/domain/services/availability-calculator.test.ts`

**Step 1: Write failing tests**

Create `src/domain/services/availability-calculator.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import {
  subtractBookings,
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
```

**Step 2: Run to verify fail**

Run: `npm test -- src/domain/services/availability-calculator.test.ts`
Expected: FAIL.

**Step 3: Implement subtractBookings**

Create `src/domain/services/availability-calculator.ts`:

```typescript
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
```

**Step 4: Run to verify pass**

Run: `npm test -- src/domain/services/availability-calculator.test.ts`
Expected: All PASS.

**Step 5: Commit**

```bash
git add src/domain/services/availability-calculator.ts src/domain/services/availability-calculator.test.ts
git commit -m "feat(domain): add subtractBookings availability algorithm with TDD"
```

---

### Task 10: AvailabilityCalculator — generateSlots

**Files:**
- Modify: `src/domain/services/availability-calculator.ts`
- Modify: `src/domain/services/availability-calculator.test.ts`

**Step 1: Add failing tests for generateSlots**

Append to `src/domain/services/availability-calculator.test.ts`:

```typescript
import {
  subtractBookings,
  generateSlots,
} from './availability-calculator'

// ... existing tests ...

describe('generateSlots', () => {
  it('generates 30-min slots from a single range', () => {
    const range = TimeRange.fromHHMM('09:00', '11:00') // 120 min
    const slots = generateSlots([range], 30)
    expect(slots).toHaveLength(4)
    expect(slots[0]).toEqual(TimeRange.fromHHMM('09:00', '09:30'))
    expect(slots[1]).toEqual(TimeRange.fromHHMM('09:30', '10:00'))
    expect(slots[2]).toEqual(TimeRange.fromHHMM('10:00', '10:30'))
    expect(slots[3]).toEqual(TimeRange.fromHHMM('10:30', '11:00'))
  })

  it('discards remainder that does not fill a slot', () => {
    const range = TimeRange.fromHHMM('09:00', '10:15') // 75 min
    const slots = generateSlots([range], 30)
    expect(slots).toHaveLength(2) // 15 min left over
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
```

**Step 2: Run to verify fail**

Run: `npm test -- src/domain/services/availability-calculator.test.ts`
Expected: FAIL — `generateSlots` not exported.

**Step 3: Implement generateSlots**

Add to `src/domain/services/availability-calculator.ts`:

```typescript
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
```

**Step 4: Run to verify pass**

Run: `npm test -- src/domain/services/availability-calculator.test.ts`
Expected: All PASS.

**Step 5: Commit**

```bash
git add src/domain/services/availability-calculator.ts src/domain/services/availability-calculator.test.ts
git commit -m "feat(domain): add generateSlots to availability calculator with TDD"
```

---

### Task 11: AvailabilityCalculator — canFitService

**Files:**
- Modify: `src/domain/services/availability-calculator.ts`
- Modify: `src/domain/services/availability-calculator.test.ts`

**Step 1: Add failing tests for canFitService**

Append to `src/domain/services/availability-calculator.test.ts`:

```typescript
import {
  subtractBookings,
  generateSlots,
  canFitService,
} from './availability-calculator'

// ... existing tests ...

describe('canFitService', () => {
  const freeRanges = [
    TimeRange.fromHHMM('09:00', '10:00'), // 60 min gap
    TimeRange.fromHHMM('11:00', '14:00'), // 180 min gap
  ]

  it('returns true when service fits in a free range', () => {
    expect(canFitService(540, 60, freeRanges)).toBe(true) // 09:00, 60min
  })

  it('returns true for service starting mid-range', () => {
    expect(canFitService(660, 120, freeRanges)).toBe(true) // 11:00, 120min
  })

  it('returns false when service overflows free range', () => {
    expect(canFitService(540, 90, freeRanges)).toBe(false) // 09:00, 90min > 60min gap
  })

  it('returns false when starting outside any free range', () => {
    expect(canFitService(600, 30, freeRanges)).toBe(false) // 10:00, in the gap
  })

  it('returns true for service exactly filling a range', () => {
    expect(canFitService(540, 60, freeRanges)).toBe(true) // exactly 09:00-10:00
  })

  it('returns false when start + duration exceeds range end', () => {
    expect(canFitService(780, 120, freeRanges)).toBe(false) // 13:00+120min=15:00 > 14:00
  })
})
```

**Step 2: Run to verify fail**

Run: `npm test -- src/domain/services/availability-calculator.test.ts`
Expected: FAIL.

**Step 3: Implement canFitService**

Add to `src/domain/services/availability-calculator.ts`:

```typescript
export function canFitService(
  startMinute: number,
  durationMinutes: number,
  freeRanges: TimeRange[]
): boolean {
  const needed = new TimeRange(startMinute, startMinute + durationMinutes)
  return freeRanges.some((free) => free.contains(needed))
}
```

**Step 4: Run to verify pass**

Run: `npm test -- src/domain/services/availability-calculator.test.ts`
Expected: All PASS.

**Step 5: Commit**

```bash
git add src/domain/services/availability-calculator.ts src/domain/services/availability-calculator.test.ts
git commit -m "feat(domain): add canFitService to availability calculator with TDD"
```

---

## Phase 5: Application Layer (TDD)

### Task 12: Repository Port Interfaces

**Files:**
- Create: `src/application/ports/tenant-repository.ts`
- Create: `src/application/ports/service-repository.ts`
- Create: `src/application/ports/schedule-repository.ts`
- Create: `src/application/ports/booking-repository.ts`
- Create: `src/application/ports/customer-repository.ts`

**Step 1: Create all port interfaces**

Create `src/application/ports/tenant-repository.ts`:

```typescript
import type { Tenant } from '@/domain/entities/tenant'

export interface TenantRepository {
  findBySlug(slug: string): Promise<Tenant | null>
  findById(id: string): Promise<Tenant | null>
}
```

Create `src/application/ports/service-repository.ts`:

```typescript
import type { Service } from '@/domain/entities/service'

export interface ServiceRepository {
  findByTenantId(tenantId: string): Promise<Service[]>
  findById(id: string): Promise<Service | null>
}
```

Create `src/application/ports/schedule-repository.ts`:

```typescript
import type { WeeklySchedule } from '@/domain/entities/weekly-schedule'

export interface ScheduleRepository {
  findByTenantId(tenantId: string): Promise<WeeklySchedule | null>
}
```

Create `src/application/ports/booking-repository.ts`:

```typescript
import type { Booking } from '@/domain/entities/booking'

export interface BookingRepository {
  findByTenantAndDate(tenantId: string, date: string): Promise<Booking[]>
  save(booking: Booking): Promise<Booking>
}
```

Create `src/application/ports/customer-repository.ts`:

```typescript
import type { Customer } from '@/domain/entities/customer'

export interface CustomerRepository {
  findByEmail(email: string): Promise<Customer | null>
  save(customer: Customer): Promise<Customer>
}
```

**Step 2: Commit**

```bash
git add src/application/ports/
git commit -m "feat(application): add repository port interfaces"
```

---

### Task 13: GetAvailabilityUseCase (TDD)

**Files:**
- Create: `src/application/use-cases/get-availability.ts`
- Create: `src/application/use-cases/get-availability.test.ts`

**Step 1: Write failing tests**

Create `src/application/use-cases/get-availability.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { GetAvailabilityUseCase } from './get-availability'
import type { TenantRepository } from '../ports/tenant-repository'
import type { ScheduleRepository } from '../ports/schedule-repository'
import type { BookingRepository } from '../ports/booking-repository'
import type { Tenant } from '@/domain/entities/tenant'
import type { Booking } from '@/domain/entities/booking'
import { WeeklySchedule } from '@/domain/entities/weekly-schedule'
import { TimeRange } from '@/domain/value-objects/time-range'
import { DayOfWeek, BookingStatus } from '@/domain/types'
import { TenantNotFoundError } from '@/domain/errors/domain-errors'

const TENANT: Tenant = {
  id: 'tenant-1',
  name: 'Peluquería Juan',
  slug: 'peluqueria-juan',
  currency: 'EUR',
  defaultLocale: 'es-ES',
  createdAt: new Date('2026-01-01'),
}

const SCHEDULE = new WeeklySchedule('tenant-1', [
  {
    dayOfWeek: DayOfWeek.MONDAY,
    timeRanges: [
      TimeRange.fromHHMM('09:00', '14:00'),
      TimeRange.fromHHMM('16:00', '20:00'),
    ],
  },
])

function createMockRepos(overrides?: {
  tenant?: Tenant | null
  schedule?: WeeklySchedule | null
  bookings?: Booking[]
}) {
  const tenantRepo: TenantRepository = {
    findBySlug: async () =>
      overrides?.tenant !== undefined ? overrides.tenant : TENANT,
    findById: async () => TENANT,
  }
  const scheduleRepo: ScheduleRepository = {
    findByTenantId: async () =>
      overrides?.schedule !== undefined ? overrides.schedule : SCHEDULE,
  }
  const bookingRepo: BookingRepository = {
    findByTenantAndDate: async () => overrides?.bookings ?? [],
    save: async (b) => b,
  }
  return { tenantRepo, scheduleRepo, bookingRepo }
}

describe('GetAvailabilityUseCase', () => {
  it('returns all slots as available when no bookings', async () => {
    const { tenantRepo, scheduleRepo, bookingRepo } = createMockRepos()
    const useCase = new GetAvailabilityUseCase(
      tenantRepo,
      scheduleRepo,
      bookingRepo
    )

    // 2026-02-23 is a Monday
    const result = await useCase.execute({
      tenantSlug: 'peluqueria-juan',
      date: '2026-02-23',
    })

    expect(result.tenantName).toBe('Peluquería Juan')
    expect(result.date).toBe('2026-02-23')
    // 09:00-14:00 = 10 slots + 16:00-20:00 = 8 slots @ 30min = 18 total
    expect(result.slots).toHaveLength(18)
    expect(result.slots.every((s) => s.available)).toBe(true)
  })

  it('marks booked slots as unavailable', async () => {
    const booking: Booking = {
      id: 'b1',
      tenantId: 'tenant-1',
      serviceId: 's1',
      customerId: 'c1',
      date: '2026-02-23',
      timeRange: TimeRange.fromHHMM('10:00', '11:00'),
      status: BookingStatus.CONFIRMED,
      createdAt: new Date(),
    }
    const { tenantRepo, scheduleRepo, bookingRepo } = createMockRepos({
      bookings: [booking],
    })
    const useCase = new GetAvailabilityUseCase(
      tenantRepo,
      scheduleRepo,
      bookingRepo
    )

    const result = await useCase.execute({
      tenantSlug: 'peluqueria-juan',
      date: '2026-02-23',
    })

    const at10 = result.slots.find((s) => s.start === '10:00')
    const at1030 = result.slots.find((s) => s.start === '10:30')
    const at0900 = result.slots.find((s) => s.start === '09:00')
    expect(at10?.available).toBe(false)
    expect(at1030?.available).toBe(false)
    expect(at0900?.available).toBe(true)
  })

  it('returns empty slots for a closed day', async () => {
    const { tenantRepo, scheduleRepo, bookingRepo } = createMockRepos()
    const useCase = new GetAvailabilityUseCase(
      tenantRepo,
      scheduleRepo,
      bookingRepo
    )

    // 2026-02-22 is a Sunday — not in the schedule
    const result = await useCase.execute({
      tenantSlug: 'peluqueria-juan',
      date: '2026-02-22',
    })

    expect(result.slots).toHaveLength(0)
  })

  it('throws TenantNotFoundError for unknown slug', async () => {
    const { tenantRepo, scheduleRepo, bookingRepo } = createMockRepos({
      tenant: null,
    })
    const useCase = new GetAvailabilityUseCase(
      tenantRepo,
      scheduleRepo,
      bookingRepo
    )

    await expect(
      useCase.execute({ tenantSlug: 'unknown', date: '2026-02-23' })
    ).rejects.toThrow(TenantNotFoundError)
  })
})
```

**Step 2: Run to verify fail**

Run: `npm test -- src/application/use-cases/get-availability.test.ts`
Expected: FAIL.

**Step 3: Implement GetAvailabilityUseCase**

Create `src/application/use-cases/get-availability.ts`:

```typescript
import type { TenantRepository } from '../ports/tenant-repository'
import type { ScheduleRepository } from '../ports/schedule-repository'
import type { BookingRepository } from '../ports/booking-repository'
import {
  subtractBookings,
  generateSlots,
} from '@/domain/services/availability-calculator'
import { TenantNotFoundError } from '@/domain/errors/domain-errors'
import type { DayOfWeek } from '@/domain/types'

export interface GetAvailabilityInput {
  tenantSlug: string
  date: string // YYYY-MM-DD
}

export interface SlotDTO {
  start: string // HH:MM
  end: string // HH:MM
  available: boolean
}

export interface GetAvailabilityOutput {
  tenantName: string
  date: string
  slots: SlotDTO[]
}

const SLOT_INTERVAL_MINUTES = 30

export class GetAvailabilityUseCase {
  constructor(
    private readonly tenantRepo: TenantRepository,
    private readonly scheduleRepo: ScheduleRepository,
    private readonly bookingRepo: BookingRepository
  ) {}

  async execute(input: GetAvailabilityInput): Promise<GetAvailabilityOutput> {
    const tenant = await this.tenantRepo.findBySlug(input.tenantSlug)
    if (!tenant) throw new TenantNotFoundError(input.tenantSlug)

    const schedule = await this.scheduleRepo.findByTenantId(tenant.id)
    const dayOfWeek = new Date(input.date).getUTCDay() as DayOfWeek
    const daySchedule = schedule?.getDaySchedule(dayOfWeek)

    if (!daySchedule) {
      return { tenantName: tenant.name, date: input.date, slots: [] }
    }

    const bookings = await this.bookingRepo.findByTenantAndDate(
      tenant.id,
      input.date
    )
    const bookedRanges = bookings.map((b) => b.timeRange)
    const freeRanges = subtractBookings(daySchedule.timeRanges, bookedRanges)
    const allSlots = generateSlots(daySchedule.timeRanges, SLOT_INTERVAL_MINUTES)

    const slots: SlotDTO[] = allSlots.map((slot) => {
      const hhmm = slot.toHHMM()
      return {
        start: hhmm.start,
        end: hhmm.end,
        available: freeRanges.some((free) => free.contains(slot)),
      }
    })

    return { tenantName: tenant.name, date: input.date, slots }
  }
}
```

> **Note:** Uses `getUTCDay()` instead of `getDay()` because date-only strings (`YYYY-MM-DD`) are parsed as UTC midnight.

**Step 4: Run to verify pass**

Run: `npm test -- src/application/use-cases/get-availability.test.ts`
Expected: All PASS.

**Step 5: Commit**

```bash
git add src/application/use-cases/get-availability.ts src/application/use-cases/get-availability.test.ts
git commit -m "feat(application): add GetAvailabilityUseCase with TDD"
```

---

### Task 14: CreateBookingUseCase (TDD)

**Files:**
- Create: `src/application/use-cases/create-booking.ts`
- Create: `src/application/use-cases/create-booking.test.ts`

**Step 1: Write failing tests**

Create `src/application/use-cases/create-booking.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { CreateBookingUseCase } from './create-booking'
import type { TenantRepository } from '../ports/tenant-repository'
import type { ServiceRepository } from '../ports/service-repository'
import type { ScheduleRepository } from '../ports/schedule-repository'
import type { BookingRepository } from '../ports/booking-repository'
import type { CustomerRepository } from '../ports/customer-repository'
import type { Tenant } from '@/domain/entities/tenant'
import type { Service } from '@/domain/entities/service'
import type { Customer } from '@/domain/entities/customer'
import type { Booking } from '@/domain/entities/booking'
import { WeeklySchedule } from '@/domain/entities/weekly-schedule'
import { TimeRange } from '@/domain/value-objects/time-range'
import { Money } from '@/domain/value-objects/money'
import { DayOfWeek, BookingStatus } from '@/domain/types'
import {
  TenantNotFoundError,
  ServiceNotFoundError,
  ServiceDoesNotFitError,
  BusinessClosedError,
} from '@/domain/errors/domain-errors'

const TENANT: Tenant = {
  id: 'tenant-1',
  name: 'Peluquería Juan',
  slug: 'peluqueria-juan',
  currency: 'EUR',
  defaultLocale: 'es-ES',
  createdAt: new Date('2026-01-01'),
}

const SERVICE: Service = {
  id: 'service-1',
  tenantId: 'tenant-1',
  name: 'Corte de pelo',
  durationMinutes: 30,
  price: new Money(1500, 'EUR'),
  active: true,
}

const CUSTOMER: Customer = {
  id: 'customer-1',
  name: 'Ana García',
  email: 'ana@example.com',
}

const SCHEDULE = new WeeklySchedule('tenant-1', [
  {
    dayOfWeek: DayOfWeek.MONDAY,
    timeRanges: [TimeRange.fromHHMM('09:00', '14:00')],
  },
])

function createMockRepos(overrides?: {
  tenant?: Tenant | null
  service?: Service | null
  schedule?: WeeklySchedule | null
  bookings?: Booking[]
  customer?: Customer | null
}) {
  const tenantRepo: TenantRepository = {
    findBySlug: async () =>
      overrides?.tenant !== undefined ? overrides.tenant : TENANT,
    findById: async () => TENANT,
  }
  const serviceRepo: ServiceRepository = {
    findById: async () =>
      overrides?.service !== undefined ? overrides.service : SERVICE,
    findByTenantId: async () => [SERVICE],
  }
  const scheduleRepo: ScheduleRepository = {
    findByTenantId: async () =>
      overrides?.schedule !== undefined ? overrides.schedule : SCHEDULE,
  }
  const bookingRepo: BookingRepository = {
    findByTenantAndDate: async () => overrides?.bookings ?? [],
    save: async (b) => b,
  }
  const customerRepo: CustomerRepository = {
    findByEmail: async () =>
      overrides?.customer !== undefined ? overrides.customer : CUSTOMER,
    save: async (c) => c,
  }
  return { tenantRepo, serviceRepo, scheduleRepo, bookingRepo, customerRepo }
}

describe('CreateBookingUseCase', () => {
  const validInput = {
    tenantSlug: 'peluqueria-juan',
    serviceId: 'service-1',
    customerEmail: 'ana@example.com',
    customerName: 'Ana García',
    date: '2026-02-23', // Monday
    startTime: '09:00',
  }

  it('creates a booking successfully', async () => {
    const repos = createMockRepos()
    const useCase = new CreateBookingUseCase(
      repos.tenantRepo,
      repos.serviceRepo,
      repos.scheduleRepo,
      repos.bookingRepo,
      repos.customerRepo
    )

    const booking = await useCase.execute(validInput)

    expect(booking.tenantId).toBe('tenant-1')
    expect(booking.serviceId).toBe('service-1')
    expect(booking.customerId).toBe('customer-1')
    expect(booking.date).toBe('2026-02-23')
    expect(booking.timeRange.start).toBe(540) // 09:00
    expect(booking.timeRange.end).toBe(570) // 09:30
    expect(booking.status).toBe(BookingStatus.PENDING)
  })

  it('throws TenantNotFoundError for unknown tenant', async () => {
    const repos = createMockRepos({ tenant: null })
    const useCase = new CreateBookingUseCase(
      repos.tenantRepo,
      repos.serviceRepo,
      repos.scheduleRepo,
      repos.bookingRepo,
      repos.customerRepo
    )

    await expect(useCase.execute(validInput)).rejects.toThrow(
      TenantNotFoundError
    )
  })

  it('throws ServiceNotFoundError for unknown service', async () => {
    const repos = createMockRepos({ service: null })
    const useCase = new CreateBookingUseCase(
      repos.tenantRepo,
      repos.serviceRepo,
      repos.scheduleRepo,
      repos.bookingRepo,
      repos.customerRepo
    )

    await expect(useCase.execute(validInput)).rejects.toThrow(
      ServiceNotFoundError
    )
  })

  it('throws BusinessClosedError when booking on closed day', async () => {
    const repos = createMockRepos()
    const useCase = new CreateBookingUseCase(
      repos.tenantRepo,
      repos.serviceRepo,
      repos.scheduleRepo,
      repos.bookingRepo,
      repos.customerRepo
    )

    await expect(
      useCase.execute({ ...validInput, date: '2026-02-22' }) // Sunday
    ).rejects.toThrow(BusinessClosedError)
  })

  it('throws ServiceDoesNotFitError when slot is occupied', async () => {
    const existingBooking: Booking = {
      id: 'existing',
      tenantId: 'tenant-1',
      serviceId: 'service-1',
      customerId: 'c2',
      date: '2026-02-23',
      timeRange: TimeRange.fromHHMM('09:00', '09:30'),
      status: BookingStatus.CONFIRMED,
      createdAt: new Date(),
    }
    const repos = createMockRepos({ bookings: [existingBooking] })
    const useCase = new CreateBookingUseCase(
      repos.tenantRepo,
      repos.serviceRepo,
      repos.scheduleRepo,
      repos.bookingRepo,
      repos.customerRepo
    )

    await expect(useCase.execute(validInput)).rejects.toThrow(
      ServiceDoesNotFitError
    )
  })

  it('creates new customer when email not found', async () => {
    const repos = createMockRepos({ customer: null })
    const saveSpy = vi.spyOn(repos.customerRepo, 'save')
    const useCase = new CreateBookingUseCase(
      repos.tenantRepo,
      repos.serviceRepo,
      repos.scheduleRepo,
      repos.bookingRepo,
      repos.customerRepo
    )

    const booking = await useCase.execute(validInput)

    expect(saveSpy).toHaveBeenCalledOnce()
    expect(booking.customerId).toBeDefined()
  })
})
```

**Step 2: Run to verify fail**

Run: `npm test -- src/application/use-cases/create-booking.test.ts`
Expected: FAIL.

**Step 3: Implement CreateBookingUseCase**

Create `src/application/use-cases/create-booking.ts`:

```typescript
import type { TenantRepository } from '../ports/tenant-repository'
import type { ServiceRepository } from '../ports/service-repository'
import type { ScheduleRepository } from '../ports/schedule-repository'
import type { BookingRepository } from '../ports/booking-repository'
import type { CustomerRepository } from '../ports/customer-repository'
import type { Booking } from '@/domain/entities/booking'
import { TimeRange } from '@/domain/value-objects/time-range'
import {
  subtractBookings,
  canFitService,
} from '@/domain/services/availability-calculator'
import { BookingStatus, type DayOfWeek } from '@/domain/types'
import {
  TenantNotFoundError,
  ServiceNotFoundError,
  BusinessClosedError,
  ServiceDoesNotFitError,
} from '@/domain/errors/domain-errors'

export interface CreateBookingInput {
  tenantSlug: string
  serviceId: string
  customerEmail: string
  customerName: string
  date: string // YYYY-MM-DD
  startTime: string // HH:MM
}

export class CreateBookingUseCase {
  constructor(
    private readonly tenantRepo: TenantRepository,
    private readonly serviceRepo: ServiceRepository,
    private readonly scheduleRepo: ScheduleRepository,
    private readonly bookingRepo: BookingRepository,
    private readonly customerRepo: CustomerRepository
  ) {}

  async execute(input: CreateBookingInput): Promise<Booking> {
    const tenant = await this.tenantRepo.findBySlug(input.tenantSlug)
    if (!tenant) throw new TenantNotFoundError(input.tenantSlug)

    const service = await this.serviceRepo.findById(input.serviceId)
    if (!service || service.tenantId !== tenant.id) {
      throw new ServiceNotFoundError(input.serviceId)
    }

    const schedule = await this.scheduleRepo.findByTenantId(tenant.id)
    const dayOfWeek = new Date(input.date).getUTCDay() as DayOfWeek
    const daySchedule = schedule?.getDaySchedule(dayOfWeek)
    if (!daySchedule) throw new BusinessClosedError(input.date)

    const existingBookings = await this.bookingRepo.findByTenantAndDate(
      tenant.id,
      input.date
    )
    const bookedRanges = existingBookings.map((b) => b.timeRange)
    const freeRanges = subtractBookings(daySchedule.timeRanges, bookedRanges)

    const startMinute = TimeRange.parseHHMM(input.startTime)
    if (!canFitService(startMinute, service.durationMinutes, freeRanges)) {
      throw new ServiceDoesNotFitError(service.durationMinutes, input.startTime)
    }

    let customer = await this.customerRepo.findByEmail(input.customerEmail)
    if (!customer) {
      customer = await this.customerRepo.save({
        id: crypto.randomUUID(),
        name: input.customerName,
        email: input.customerEmail,
      })
    }

    const booking: Booking = {
      id: crypto.randomUUID(),
      tenantId: tenant.id,
      serviceId: service.id,
      customerId: customer.id,
      date: input.date,
      timeRange: new TimeRange(
        startMinute,
        startMinute + service.durationMinutes
      ),
      status: BookingStatus.PENDING,
      createdAt: new Date(),
    }

    return this.bookingRepo.save(booking)
  }
}
```

**Step 4: Run to verify pass**

Run: `npm test -- src/application/use-cases/create-booking.test.ts`
Expected: All PASS.

**Step 5: Run full test suite**

Run: `npm test`
Expected: All tests across all files PASS.

**Step 6: Commit**

```bash
git add src/application/use-cases/create-booking.ts src/application/use-cases/create-booking.test.ts
git commit -m "feat(application): add CreateBookingUseCase with TDD"
```

---

## Phase 6: Infrastructure (Outlined)

### Task 15: Supabase Setup and Database Schema

**Files:**
- Create: `src/infrastructure/supabase/client.ts`
- Create: `supabase/migrations/001_initial_schema.sql`

**Summary:**
1. Install `@supabase/supabase-js`. Create `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. Create typed Supabase client in `client.ts`.
3. Write SQL migration with tables: `tenants` (id UUID PK, name, slug UNIQUE, currency, default_locale, created_at), `services` (id, tenant_id FK, name, duration_minutes, price_cents, currency, active), `schedule_days` (id, tenant_id FK, day_of_week, time_ranges JSONB), `customers` (id, name, email UNIQUE, phone), `bookings` (id, tenant_id FK, service_id FK, customer_id FK, date DATE, start_minute INT, end_minute INT, status, created_at).
4. Add RLS policies: tenants read-only for public, services read-only filtered by tenant, bookings insert for authenticated + read filtered by tenant.
5. Add indexes: `bookings(tenant_id, date)`, `tenants(slug)`.

---

### Task 16: Supabase Repository Implementations

**Files:**
- Create: `src/infrastructure/supabase/repositories/supabase-tenant-repository.ts`
- Create: `src/infrastructure/supabase/repositories/supabase-service-repository.ts`
- Create: `src/infrastructure/supabase/repositories/supabase-schedule-repository.ts`
- Create: `src/infrastructure/supabase/repositories/supabase-booking-repository.ts`
- Create: `src/infrastructure/supabase/repositories/supabase-customer-repository.ts`

**Summary:** Implement each port interface using the Supabase client. Map DB rows to domain entities (e.g., `start_minute`/`end_minute` → `TimeRange`, `price_cents`/`currency` → `Money`). Integration-test with local Supabase (`supabase start`).

---

### Task 17: Stripe Integration

**Files:**
- Create: `src/infrastructure/stripe/stripe-payment-service.ts`
- Create: `src/app/api/webhooks/stripe/route.ts`

**Summary:** Install `stripe`. Implement Checkout Session creation for online payments via Stripe Connect. Create webhook route handler to update booking status to `CONFIRMED` on `checkout.session.completed`. Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to env.

---

## Phase 7: Presentation (Outlined)

### Task 18: Next.js i18n Setup

**Files:**
- Create: `src/i18n/config.ts`
- Create: `src/i18n/messages/es-ES.json`
- Create: `src/i18n/messages/en-US.json`
- Create: `src/app/[locale]/layout.tsx`
- Create: `src/app/[locale]/page.tsx`
- Modify: `src/app/layout.tsx`

**Summary:** Install `next-intl`. Configure `es-ES` and `en-US` locales. Create locale-based routing under `[locale]` segment. Add translations for common UI labels (booking, services, schedule, etc.).

---

### Task 19: Tenant Public Page + Routing

**Files:**
- Create: `src/app/[locale]/[slug]/page.tsx`
- Create: `src/app/[locale]/[slug]/actions.ts` (Server Actions)

**Summary:** Dynamic route resolving tenant by slug. Server Action calls `GetAvailabilityUseCase` to fetch today's availability. Renders the availability grid. If tenant not found, returns 404.

---

### Task 20: Availability Grid Component

**Files:**
- Create: `src/components/availability-grid.tsx`
- Create: `src/components/date-navigator.tsx`

**Summary:** Responsive time-slot grid. Free slots are clickable (green); booked slots are greyed out. Date navigator (prev/next day arrows). Client-side state: `selectedSlot`, `selectedDate`. Calls Server Action on date change to refresh availability.

---

### Task 21: Booking Flow + Checkout

**Files:**
- Create: `src/components/service-selector.tsx`
- Create: `src/components/booking-form.tsx`
- Create: `src/app/[locale]/[slug]/confirm/page.tsx`

**Summary:** After selecting a time slot, show service selector (filtered by tenant). Display price and fit validation. Collect customer name + email. Submit via Server Action → `CreateBookingUseCase`. For online payment, redirect to Stripe Checkout. For local payment, show confirmation. Confirmation page shows booking details.

---

## Architecture Summary

```
src/
├── domain/                          ← Pure, framework-independent
│   ├── types.ts                     ← Currency, Locale, DayOfWeek, BookingStatus
│   ├── errors/domain-errors.ts      ← Domain error hierarchy
│   ├── value-objects/
│   │   ├── time-range.ts + .test.ts ← Core time logic
│   │   ├── money.ts + .test.ts      ← Monetary values
│   │   └── slug.ts + .test.ts       ← URL slugs
│   ├── entities/
│   │   ├── tenant.ts                ← Tenant interface
│   │   ├── service.ts               ← Service interface
│   │   ├── customer.ts              ← Customer interface
│   │   ├── booking.ts               ← Booking interface
│   │   └── weekly-schedule.ts       ← Schedule with behavior
│   └── services/
│       └── availability-calculator.ts ← Core availability algorithm
├── application/                      ← Orchestration layer
│   ├── ports/                        ← Repository interfaces (DI)
│   │   ├── tenant-repository.ts
│   │   ├── service-repository.ts
│   │   ├── schedule-repository.ts
│   │   ├── booking-repository.ts
│   │   └── customer-repository.ts
│   └── use-cases/
│       ├── get-availability.ts       ← Query: slot availability
│       └── create-booking.ts         ← Command: make a booking
├── infrastructure/                   ← External integrations
│   ├── supabase/
│   │   ├── client.ts
│   │   └── repositories/
│   └── stripe/
├── app/                              ← Next.js App Router
│   └── [locale]/[slug]/
└── components/                       ← React UI
```
