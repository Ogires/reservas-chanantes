# Domain Refactor: Slot-First Model — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Project:** `reservas-chanantes`

**Goal:** Refactor the domain model so that slots are a first-class entity defined by the tenant (not generated algorithmically). Support arbitrary slot durations, consecutive slot selection with max-duration limits, and flexible pricing strategies (fixed or duration-based).

**Architecture:** Same Clean Architecture layers. This refactor affects Domain and Application only — no infrastructure or presentation changes.

**Key design decisions:**
- `SlotDefinition` uses concrete `startDateTime`/`endDateTime` (not dayOfWeek + minutes). Supports seasonal schedules, holidays, one-off changes.
- Consecutivity is determined by datetime adjacency (`endA === startB`), no explicit position field needed.
- `TenantBookingConfig` is a separate value object — extensible for future config (buffer, max advance days, etc.) without touching Tenant.
- `PricingStrategy` is polymorphic — `FixedPricing` or `DurationBasedPricing`. New strategies can be added without modifying existing code (OCP).
- `TimeRange` is kept in codebase (well-tested, useful for future schedule templates) but new domain services don't depend on it.

---

## Phase A: New Domain Entities

### Task R1: Add SlotDefinition entity

**Files:**
- Create: `src/domain/entities/slot-definition.ts`

**Step 1: Create SlotDefinition**

```typescript
export interface SlotDefinition {
  readonly id: string
  readonly tenantId: string
  readonly startDateTime: Date
  readonly endDateTime: Date
}
```

**Step 2: Commit**

```bash
git add src/domain/entities/slot-definition.ts
git commit -m "feat(domain): add SlotDefinition entity with concrete datetimes"
```

---

### Task R2: Add TenantBookingConfig value object (TDD)

**Files:**
- Create: `src/domain/value-objects/tenant-booking-config.ts`
- Create: `src/domain/value-objects/tenant-booking-config.test.ts`

**Step 1: Write failing tests**

```typescript
import { describe, it, expect } from 'vitest'
import { TenantBookingConfig } from './tenant-booking-config'

describe('TenantBookingConfig', () => {
  it('creates a valid config', () => {
    const config = new TenantBookingConfig({
      allowConsecutiveSlots: true,
      maxBookingDurationMinutes: 120,
    })
    expect(config.allowConsecutiveSlots).toBe(true)
    expect(config.maxBookingDurationMinutes).toBe(120)
    expect(config.minBookingDurationMinutes).toBeNull()
  })

  it('creates config with min duration', () => {
    const config = new TenantBookingConfig({
      allowConsecutiveSlots: true,
      maxBookingDurationMinutes: 120,
      minBookingDurationMinutes: 30,
    })
    expect(config.minBookingDurationMinutes).toBe(30)
  })

  it('throws if maxDuration is not positive', () => {
    expect(
      () =>
        new TenantBookingConfig({
          allowConsecutiveSlots: true,
          maxBookingDurationMinutes: 0,
        })
    ).toThrow()
  })

  it('throws if minDuration > maxDuration', () => {
    expect(
      () =>
        new TenantBookingConfig({
          allowConsecutiveSlots: true,
          maxBookingDurationMinutes: 30,
          minBookingDurationMinutes: 60,
        })
    ).toThrow()
  })

  it('consecutive not allowed means max 1 slot', () => {
    const config = new TenantBookingConfig({
      allowConsecutiveSlots: false,
      maxBookingDurationMinutes: 60,
    })
    expect(config.allowConsecutiveSlots).toBe(false)
  })
})
```

**Step 2: Run to verify fail**

Run: `npm test -- src/domain/value-objects/tenant-booking-config.test.ts`

**Step 3: Implement**

```typescript
import { DomainError } from '../errors/domain-errors'

export class InvalidBookingConfigError extends DomainError {
  constructor(message: string) {
    super(`Invalid booking config: ${message}`)
  }
}

interface TenantBookingConfigProps {
  allowConsecutiveSlots: boolean
  maxBookingDurationMinutes: number
  minBookingDurationMinutes?: number
}

export class TenantBookingConfig {
  readonly allowConsecutiveSlots: boolean
  readonly maxBookingDurationMinutes: number
  readonly minBookingDurationMinutes: number | null

  constructor(props: TenantBookingConfigProps) {
    if (props.maxBookingDurationMinutes <= 0) {
      throw new InvalidBookingConfigError(
        'maxBookingDurationMinutes must be positive'
      )
    }
    if (
      props.minBookingDurationMinutes !== undefined &&
      props.minBookingDurationMinutes > props.maxBookingDurationMinutes
    ) {
      throw new InvalidBookingConfigError(
        'minBookingDurationMinutes cannot exceed maxBookingDurationMinutes'
      )
    }
    this.allowConsecutiveSlots = props.allowConsecutiveSlots
    this.maxBookingDurationMinutes = props.maxBookingDurationMinutes
    this.minBookingDurationMinutes = props.minBookingDurationMinutes ?? null
  }
}
```

**Step 4: Run to verify pass**

**Step 5: Commit**

```bash
git add src/domain/value-objects/tenant-booking-config.ts src/domain/value-objects/tenant-booking-config.test.ts
git commit -m "feat(domain): add TenantBookingConfig value object with TDD"
```

---

### Task R3: Add PricingStrategy value objects (TDD)

**Files:**
- Create: `src/domain/value-objects/pricing-strategy.ts`
- Create: `src/domain/value-objects/pricing-strategy.test.ts`

**Step 1: Write failing tests**

```typescript
import { describe, it, expect } from 'vitest'
import {
  FixedPricing,
  DurationBasedPricing,
  type PricingTier,
} from './pricing-strategy'
import { Money } from './money'

describe('FixedPricing', () => {
  it('returns the fixed price regardless of duration', () => {
    const pricing = new FixedPricing(new Money(1500, 'EUR'))
    expect(pricing.calculatePrice(30).equals(new Money(1500, 'EUR'))).toBe(true)
    expect(pricing.calculatePrice(60).equals(new Money(1500, 'EUR'))).toBe(true)
  })

  it('has type "fixed"', () => {
    const pricing = new FixedPricing(new Money(1500, 'EUR'))
    expect(pricing.type).toBe('fixed')
  })
})

describe('DurationBasedPricing', () => {
  const tiers: PricingTier[] = [
    { durationMinutes: 30, price: new Money(3000, 'EUR') },
    { durationMinutes: 45, price: new Money(4000, 'EUR') },
    { durationMinutes: 60, price: new Money(5000, 'EUR') },
  ]

  it('returns price for exact duration match', () => {
    const pricing = new DurationBasedPricing(tiers)
    expect(pricing.calculatePrice(30).equals(new Money(3000, 'EUR'))).toBe(true)
    expect(pricing.calculatePrice(60).equals(new Money(5000, 'EUR'))).toBe(true)
  })

  it('throws for duration with no matching tier', () => {
    const pricing = new DurationBasedPricing(tiers)
    expect(() => pricing.calculatePrice(90)).toThrow()
  })

  it('has type "duration-based"', () => {
    const pricing = new DurationBasedPricing(tiers)
    expect(pricing.type).toBe('duration-based')
  })

  it('throws if no tiers provided', () => {
    expect(() => new DurationBasedPricing([])).toThrow()
  })
})
```

**Step 2: Run to verify fail**

**Step 3: Implement**

```typescript
import { Money } from './money'
import { DomainError } from '../errors/domain-errors'

export class NoPricingTierError extends DomainError {
  constructor(durationMinutes: number) {
    super(`No pricing tier found for duration: ${durationMinutes} minutes`)
  }
}

export class InvalidPricingError extends DomainError {
  constructor(message: string) {
    super(`Invalid pricing: ${message}`)
  }
}

export interface PricingTier {
  readonly durationMinutes: number
  readonly price: Money
}

export interface PricingStrategy {
  readonly type: 'fixed' | 'duration-based'
  calculatePrice(durationMinutes: number): Money
}

export class FixedPricing implements PricingStrategy {
  readonly type = 'fixed' as const

  constructor(readonly price: Money) {}

  calculatePrice(): Money {
    return this.price
  }
}

export class DurationBasedPricing implements PricingStrategy {
  readonly type = 'duration-based' as const
  readonly tiers: PricingTier[]

  constructor(tiers: PricingTier[]) {
    if (tiers.length === 0) {
      throw new InvalidPricingError('At least one pricing tier is required')
    }
    this.tiers = [...tiers].sort((a, b) => a.durationMinutes - b.durationMinutes)
  }

  calculatePrice(durationMinutes: number): Money {
    const tier = this.tiers.find((t) => t.durationMinutes === durationMinutes)
    if (!tier) throw new NoPricingTierError(durationMinutes)
    return tier.price
  }
}
```

**Step 4: Run to verify pass**

**Step 5: Commit**

```bash
git add src/domain/value-objects/pricing-strategy.ts src/domain/value-objects/pricing-strategy.test.ts
git commit -m "feat(domain): add PricingStrategy (Fixed + DurationBased) with TDD"
```

---

### Task R4: Refactor Tenant and Service entities

**Files:**
- Modify: `src/domain/entities/tenant.ts`
- Modify: `src/domain/entities/service.ts`
- Modify: `src/domain/entities/booking.ts`

**Step 1: Update Tenant**

```typescript
import type { Currency, Locale } from '../types'
import type { TenantBookingConfig } from '../value-objects/tenant-booking-config'

export interface Tenant {
  readonly id: string
  readonly name: string
  readonly slug: string
  readonly currency: Currency
  readonly defaultLocale: Locale
  readonly bookingConfig: TenantBookingConfig
  readonly createdAt: Date
}
```

**Step 2: Update Service**

```typescript
import type { PricingStrategy } from '../value-objects/pricing-strategy'

export interface Service {
  readonly id: string
  readonly tenantId: string
  readonly name: string
  readonly pricing: PricingStrategy
  readonly active: boolean
}
```

Note: `durationMinutes` and `price: Money` removed. Duration is determined by the slots the customer selects. Price is calculated by the PricingStrategy based on that duration.

**Step 3: Update Booking**

```typescript
import type { BookingStatus } from '../types'
import type { Money } from '../value-objects/money'

export interface Booking {
  readonly id: string
  readonly tenantId: string
  readonly serviceId: string | null
  readonly customerId: string
  readonly date: string // YYYY-MM-DD
  readonly slotIds: string[]
  readonly startDateTime: Date
  readonly endDateTime: Date
  readonly totalPrice: Money
  readonly status: BookingStatus
  readonly createdAt: Date
}
```

Note: `timeRange: TimeRange` replaced with `slotIds` + derived `startDateTime`/`endDateTime`. `totalPrice` added since pricing is now calculated at booking time.

**Step 4: Commit**

```bash
git add src/domain/entities/tenant.ts src/domain/entities/service.ts src/domain/entities/booking.ts
git commit -m "refactor(domain): update Tenant, Service, Booking for slot-first model"
```

---

## Phase B: Domain Services Refactor (TDD)

### Task R5: Rewrite AvailabilityCalculator (TDD)

**Files:**
- Rewrite: `src/domain/services/availability-calculator.ts`
- Rewrite: `src/domain/services/availability-calculator.test.ts`

**Step 1: Write failing tests**

```typescript
import { describe, it, expect } from 'vitest'
import {
  getSlotAvailability,
  areConsecutive,
  totalDurationMinutes,
  isValidBookingDuration,
} from './availability-calculator'
import type { SlotDefinition } from '../entities/slot-definition'
import { TenantBookingConfig } from '../value-objects/tenant-booking-config'

// Helper: create a slot for 2026-03-02 (Monday)
function slot(
  id: string,
  startHour: number,
  startMin: number,
  endHour: number,
  endMin: number
): SlotDefinition {
  return {
    id,
    tenantId: 'tenant-1',
    startDateTime: new Date(Date.UTC(2026, 2, 2, startHour, startMin)),
    endDateTime: new Date(Date.UTC(2026, 2, 2, endHour, endMin)),
  }
}

describe('getSlotAvailability', () => {
  const slots = [
    slot('s1', 9, 0, 9, 30),
    slot('s2', 9, 30, 10, 0),
    slot('s3', 10, 0, 10, 30),
  ]

  it('all available when no bookings', () => {
    const result = getSlotAvailability(slots, new Set())
    expect(result).toHaveLength(3)
    expect(result.every((r) => r.available)).toBe(true)
  })

  it('marks booked slots as unavailable', () => {
    const result = getSlotAvailability(slots, new Set(['s2']))
    expect(result[0].available).toBe(true)
    expect(result[1].available).toBe(false)
    expect(result[2].available).toBe(true)
  })

  it('all unavailable when all booked', () => {
    const result = getSlotAvailability(slots, new Set(['s1', 's2', 's3']))
    expect(result.every((r) => !r.available)).toBe(true)
  })
})

describe('areConsecutive', () => {
  it('single slot is consecutive', () => {
    expect(areConsecutive([slot('s1', 9, 0, 9, 30)])).toBe(true)
  })

  it('adjacent slots are consecutive', () => {
    const slots = [slot('s1', 9, 0, 9, 30), slot('s2', 9, 30, 10, 0)]
    expect(areConsecutive(slots)).toBe(true)
  })

  it('works regardless of input order', () => {
    const slots = [slot('s2', 9, 30, 10, 0), slot('s1', 9, 0, 9, 30)]
    expect(areConsecutive(slots)).toBe(true)
  })

  it('non-adjacent slots are not consecutive', () => {
    const slots = [slot('s1', 9, 0, 9, 30), slot('s3', 10, 0, 10, 30)]
    expect(areConsecutive(slots)).toBe(false)
  })

  it('three consecutive slots', () => {
    const slots = [
      slot('s1', 9, 0, 9, 30),
      slot('s2', 9, 30, 10, 0),
      slot('s3', 10, 0, 10, 30),
    ]
    expect(areConsecutive(slots)).toBe(true)
  })

  it('slots with different durations are consecutive if adjacent', () => {
    const slots = [
      slot('s1', 9, 0, 10, 0),   // 60 min
      slot('s2', 10, 0, 10, 30),  // 30 min
    ]
    expect(areConsecutive(slots)).toBe(true)
  })

  it('empty array is consecutive', () => {
    expect(areConsecutive([])).toBe(true)
  })
})

describe('totalDurationMinutes', () => {
  it('single 30-min slot', () => {
    expect(totalDurationMinutes([slot('s1', 9, 0, 9, 30)])).toBe(30)
  })

  it('two slots of different durations', () => {
    const slots = [
      slot('s1', 9, 0, 10, 0),   // 60 min
      slot('s2', 10, 0, 10, 30),  // 30 min
    ]
    expect(totalDurationMinutes(slots)).toBe(90)
  })

  it('empty returns 0', () => {
    expect(totalDurationMinutes([])).toBe(0)
  })
})

describe('isValidBookingDuration', () => {
  it('valid when within bounds', () => {
    const config = new TenantBookingConfig({
      allowConsecutiveSlots: true,
      maxBookingDurationMinutes: 120,
      minBookingDurationMinutes: 30,
    })
    expect(isValidBookingDuration(60, config)).toBe(true)
  })

  it('invalid when exceeds max', () => {
    const config = new TenantBookingConfig({
      allowConsecutiveSlots: true,
      maxBookingDurationMinutes: 60,
    })
    expect(isValidBookingDuration(90, config)).toBe(false)
  })

  it('invalid when below min', () => {
    const config = new TenantBookingConfig({
      allowConsecutiveSlots: true,
      maxBookingDurationMinutes: 120,
      minBookingDurationMinutes: 30,
    })
    expect(isValidBookingDuration(15, config)).toBe(false)
  })

  it('valid at exact max boundary', () => {
    const config = new TenantBookingConfig({
      allowConsecutiveSlots: true,
      maxBookingDurationMinutes: 60,
    })
    expect(isValidBookingDuration(60, config)).toBe(true)
  })

  it('valid when no min configured', () => {
    const config = new TenantBookingConfig({
      allowConsecutiveSlots: true,
      maxBookingDurationMinutes: 120,
    })
    expect(isValidBookingDuration(10, config)).toBe(true)
  })
})
```

**Step 2: Run to verify fail**

**Step 3: Implement**

```typescript
import type { SlotDefinition } from '../entities/slot-definition'
import type { TenantBookingConfig } from '../value-objects/tenant-booking-config'

export interface SlotAvailability {
  slot: SlotDefinition
  available: boolean
}

export function getSlotAvailability(
  slots: SlotDefinition[],
  bookedSlotIds: Set<string>
): SlotAvailability[] {
  return slots.map((slot) => ({
    slot,
    available: !bookedSlotIds.has(slot.id),
  }))
}

export function areConsecutive(slots: SlotDefinition[]): boolean {
  if (slots.length <= 1) return true
  const sorted = [...slots].sort(
    (a, b) => a.startDateTime.getTime() - b.startDateTime.getTime()
  )
  for (let i = 1; i < sorted.length; i++) {
    if (
      sorted[i].startDateTime.getTime() !== sorted[i - 1].endDateTime.getTime()
    ) {
      return false
    }
  }
  return true
}

export function totalDurationMinutes(slots: SlotDefinition[]): number {
  return slots.reduce((sum, s) => {
    const diffMs = s.endDateTime.getTime() - s.startDateTime.getTime()
    return sum + diffMs / (1000 * 60)
  }, 0)
}

export function isValidBookingDuration(
  durationMinutes: number,
  config: TenantBookingConfig
): boolean {
  if (durationMinutes > config.maxBookingDurationMinutes) return false
  if (
    config.minBookingDurationMinutes !== null &&
    durationMinutes < config.minBookingDurationMinutes
  ) {
    return false
  }
  return true
}
```

**Step 4: Run to verify pass**

**Step 5: Commit**

```bash
git add src/domain/services/availability-calculator.ts src/domain/services/availability-calculator.test.ts
git commit -m "refactor(domain): rewrite AvailabilityCalculator for slot-first model with TDD"
```

---

## Phase C: Application Layer Refactor (TDD)

### Task R6: Add SlotDefinitionRepository port

**Files:**
- Create: `src/application/ports/slot-definition-repository.ts`

**Step 1: Create port**

```typescript
import type { SlotDefinition } from '@/domain/entities/slot-definition'

export interface SlotDefinitionRepository {
  findByTenantAndDate(tenantId: string, date: string): Promise<SlotDefinition[]>
  findByIds(ids: string[]): Promise<SlotDefinition[]>
}
```

**Step 2: Commit**

```bash
git add src/application/ports/slot-definition-repository.ts
git commit -m "feat(application): add SlotDefinitionRepository port"
```

---

### Task R7: Rewrite GetAvailabilityUseCase (TDD)

**Files:**
- Rewrite: `src/application/use-cases/get-availability.ts`
- Rewrite: `src/application/use-cases/get-availability.test.ts`

**Step 1: Write failing tests**

```typescript
import { describe, it, expect } from 'vitest'
import { GetAvailabilityUseCase } from './get-availability'
import type { TenantRepository } from '../ports/tenant-repository'
import type { SlotDefinitionRepository } from '../ports/slot-definition-repository'
import type { BookingRepository } from '../ports/booking-repository'
import type { Tenant } from '@/domain/entities/tenant'
import type { Booking } from '@/domain/entities/booking'
import type { SlotDefinition } from '@/domain/entities/slot-definition'
import { TenantBookingConfig } from '@/domain/value-objects/tenant-booking-config'
import { Money } from '@/domain/value-objects/money'
import { BookingStatus } from '@/domain/types'
import { TenantNotFoundError } from '@/domain/errors/domain-errors'

const CONFIG = new TenantBookingConfig({
  allowConsecutiveSlots: true,
  maxBookingDurationMinutes: 120,
})

const TENANT: Tenant = {
  id: 'tenant-1',
  name: 'Peluquería Juan',
  slug: 'peluqueria-juan',
  currency: 'EUR',
  defaultLocale: 'es-ES',
  bookingConfig: CONFIG,
  createdAt: new Date('2026-01-01'),
}

function slot(id: string, startH: number, startM: number, endH: number, endM: number): SlotDefinition {
  return {
    id,
    tenantId: 'tenant-1',
    startDateTime: new Date(Date.UTC(2026, 1, 23, startH, startM)),
    endDateTime: new Date(Date.UTC(2026, 1, 23, endH, endM)),
  }
}

const SLOTS: SlotDefinition[] = [
  slot('s1', 9, 0, 9, 30),
  slot('s2', 9, 30, 10, 0),
  slot('s3', 10, 0, 10, 30),
]

function createMockRepos(overrides?: {
  tenant?: Tenant | null
  slots?: SlotDefinition[]
  bookings?: Booking[]
}) {
  const tenantRepo: TenantRepository = {
    findBySlug: async () =>
      overrides?.tenant !== undefined ? overrides.tenant : TENANT,
    findById: async () => TENANT,
  }
  const slotRepo: SlotDefinitionRepository = {
    findByTenantAndDate: async () => overrides?.slots ?? SLOTS,
    findByIds: async (ids) => (overrides?.slots ?? SLOTS).filter(s => ids.includes(s.id)),
  }
  const bookingRepo: BookingRepository = {
    findByTenantAndDate: async () => overrides?.bookings ?? [],
    save: async (b) => b,
  }
  return { tenantRepo, slotRepo, bookingRepo }
}

describe('GetAvailabilityUseCase', () => {
  it('returns all slots as available when no bookings', async () => {
    const { tenantRepo, slotRepo, bookingRepo } = createMockRepos()
    const useCase = new GetAvailabilityUseCase(tenantRepo, slotRepo, bookingRepo)

    const result = await useCase.execute({
      tenantSlug: 'peluqueria-juan',
      date: '2026-02-23',
    })

    expect(result.tenantName).toBe('Peluquería Juan')
    expect(result.slots).toHaveLength(3)
    expect(result.slots.every((s) => s.available)).toBe(true)
    expect(result.allowConsecutive).toBe(true)
    expect(result.maxBookingDurationMinutes).toBe(120)
  })

  it('marks booked slots as unavailable', async () => {
    const booking: Booking = {
      id: 'b1',
      tenantId: 'tenant-1',
      serviceId: null,
      customerId: 'c1',
      date: '2026-02-23',
      slotIds: ['s2'],
      startDateTime: new Date(Date.UTC(2026, 1, 23, 9, 30)),
      endDateTime: new Date(Date.UTC(2026, 1, 23, 10, 0)),
      totalPrice: new Money(1500, 'EUR'),
      status: BookingStatus.CONFIRMED,
      createdAt: new Date(),
    }
    const { tenantRepo, slotRepo, bookingRepo } = createMockRepos({
      bookings: [booking],
    })
    const useCase = new GetAvailabilityUseCase(tenantRepo, slotRepo, bookingRepo)

    const result = await useCase.execute({
      tenantSlug: 'peluqueria-juan',
      date: '2026-02-23',
    })

    expect(result.slots[0].available).toBe(true)  // s1
    expect(result.slots[1].available).toBe(false) // s2 booked
    expect(result.slots[2].available).toBe(true)  // s3
  })

  it('returns empty when no slots defined for the date', async () => {
    const { tenantRepo, slotRepo, bookingRepo } = createMockRepos({ slots: [] })
    const useCase = new GetAvailabilityUseCase(tenantRepo, slotRepo, bookingRepo)

    const result = await useCase.execute({
      tenantSlug: 'peluqueria-juan',
      date: '2026-02-23',
    })

    expect(result.slots).toHaveLength(0)
  })

  it('throws TenantNotFoundError for unknown slug', async () => {
    const { tenantRepo, slotRepo, bookingRepo } = createMockRepos({ tenant: null })
    const useCase = new GetAvailabilityUseCase(tenantRepo, slotRepo, bookingRepo)

    await expect(
      useCase.execute({ tenantSlug: 'unknown', date: '2026-02-23' })
    ).rejects.toThrow(TenantNotFoundError)
  })
})
```

**Step 2: Run to verify fail**

**Step 3: Implement**

```typescript
import type { TenantRepository } from '../ports/tenant-repository'
import type { SlotDefinitionRepository } from '../ports/slot-definition-repository'
import type { BookingRepository } from '../ports/booking-repository'
import { getSlotAvailability } from '@/domain/services/availability-calculator'
import { TenantNotFoundError } from '@/domain/errors/domain-errors'

export interface GetAvailabilityInput {
  tenantSlug: string
  date: string // YYYY-MM-DD
}

export interface SlotDTO {
  id: string
  startDateTime: string // ISO 8601
  endDateTime: string   // ISO 8601
  durationMinutes: number
  available: boolean
}

export interface GetAvailabilityOutput {
  tenantName: string
  date: string
  allowConsecutive: boolean
  maxBookingDurationMinutes: number
  minBookingDurationMinutes: number | null
  slots: SlotDTO[]
}

export class GetAvailabilityUseCase {
  constructor(
    private readonly tenantRepo: TenantRepository,
    private readonly slotRepo: SlotDefinitionRepository,
    private readonly bookingRepo: BookingRepository
  ) {}

  async execute(input: GetAvailabilityInput): Promise<GetAvailabilityOutput> {
    const tenant = await this.tenantRepo.findBySlug(input.tenantSlug)
    if (!tenant) throw new TenantNotFoundError(input.tenantSlug)

    const slots = await this.slotRepo.findByTenantAndDate(
      tenant.id,
      input.date
    )
    const bookings = await this.bookingRepo.findByTenantAndDate(
      tenant.id,
      input.date
    )

    const bookedSlotIds = new Set(bookings.flatMap((b) => b.slotIds))
    const availability = getSlotAvailability(slots, bookedSlotIds)

    return {
      tenantName: tenant.name,
      date: input.date,
      allowConsecutive: tenant.bookingConfig.allowConsecutiveSlots,
      maxBookingDurationMinutes:
        tenant.bookingConfig.maxBookingDurationMinutes,
      minBookingDurationMinutes:
        tenant.bookingConfig.minBookingDurationMinutes,
      slots: availability.map(({ slot, available }) => ({
        id: slot.id,
        startDateTime: slot.startDateTime.toISOString(),
        endDateTime: slot.endDateTime.toISOString(),
        durationMinutes:
          (slot.endDateTime.getTime() - slot.startDateTime.getTime()) /
          (1000 * 60),
        available,
      })),
    }
  }
}
```

**Step 4: Run to verify pass**

**Step 5: Commit**

```bash
git add src/application/use-cases/get-availability.ts src/application/use-cases/get-availability.test.ts
git commit -m "refactor(application): rewrite GetAvailabilityUseCase for slot-first model with TDD"
```

---

### Task R8: Rewrite CreateBookingUseCase (TDD)

**Files:**
- Rewrite: `src/application/use-cases/create-booking.ts`
- Rewrite: `src/application/use-cases/create-booking.test.ts`

**Step 1: Write failing tests**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { CreateBookingUseCase } from './create-booking'
import type { TenantRepository } from '../ports/tenant-repository'
import type { ServiceRepository } from '../ports/service-repository'
import type { SlotDefinitionRepository } from '../ports/slot-definition-repository'
import type { BookingRepository } from '../ports/booking-repository'
import type { CustomerRepository } from '../ports/customer-repository'
import type { Tenant } from '@/domain/entities/tenant'
import type { Service } from '@/domain/entities/service'
import type { Customer } from '@/domain/entities/customer'
import type { Booking } from '@/domain/entities/booking'
import type { SlotDefinition } from '@/domain/entities/slot-definition'
import { TenantBookingConfig } from '@/domain/value-objects/tenant-booking-config'
import { FixedPricing, DurationBasedPricing } from '@/domain/value-objects/pricing-strategy'
import { Money } from '@/domain/value-objects/money'
import { BookingStatus } from '@/domain/types'
import {
  TenantNotFoundError,
  ServiceDoesNotFitError,
  BookingConflictError,
} from '@/domain/errors/domain-errors'

const CONFIG = new TenantBookingConfig({
  allowConsecutiveSlots: true,
  maxBookingDurationMinutes: 120,
  minBookingDurationMinutes: 30,
})

const TENANT: Tenant = {
  id: 'tenant-1',
  name: 'Peluquería Juan',
  slug: 'peluqueria-juan',
  currency: 'EUR',
  defaultLocale: 'es-ES',
  bookingConfig: CONFIG,
  createdAt: new Date('2026-01-01'),
}

const FIXED_SERVICE: Service = {
  id: 'svc-1',
  tenantId: 'tenant-1',
  name: 'Corte de pelo',
  pricing: new FixedPricing(new Money(1500, 'EUR')),
  active: true,
}

const DURATION_SERVICE: Service = {
  id: 'svc-2',
  tenantId: 'tenant-1',
  name: 'Masaje',
  pricing: new DurationBasedPricing([
    { durationMinutes: 30, price: new Money(3000, 'EUR') },
    { durationMinutes: 60, price: new Money(5000, 'EUR') },
  ]),
  active: true,
}

const CUSTOMER: Customer = { id: 'c1', name: 'Ana', email: 'ana@example.com' }

function slot(id: string, startH: number, startM: number, endH: number, endM: number): SlotDefinition {
  return {
    id,
    tenantId: 'tenant-1',
    startDateTime: new Date(Date.UTC(2026, 1, 23, startH, startM)),
    endDateTime: new Date(Date.UTC(2026, 1, 23, endH, endM)),
  }
}

const SLOTS = [
  slot('s1', 9, 0, 9, 30),
  slot('s2', 9, 30, 10, 0),
  slot('s3', 10, 0, 10, 30),
  slot('s4', 10, 30, 11, 0),
]

function createMockRepos(overrides?: {
  tenant?: Tenant | null
  service?: Service | null
  slots?: SlotDefinition[]
  bookings?: Booking[]
  customer?: Customer | null
}) {
  const tenantRepo: TenantRepository = {
    findBySlug: async () => overrides?.tenant !== undefined ? overrides.tenant : TENANT,
    findById: async () => TENANT,
  }
  const serviceRepo: ServiceRepository = {
    findById: async () => overrides?.service !== undefined ? overrides.service : FIXED_SERVICE,
    findByTenantId: async () => [FIXED_SERVICE],
  }
  const slotRepo: SlotDefinitionRepository = {
    findByTenantAndDate: async () => overrides?.slots ?? SLOTS,
    findByIds: async (ids) => (overrides?.slots ?? SLOTS).filter(s => ids.includes(s.id)),
  }
  const bookingRepo: BookingRepository = {
    findByTenantAndDate: async () => overrides?.bookings ?? [],
    save: async (b) => b,
  }
  const customerRepo: CustomerRepository = {
    findByEmail: async () => overrides?.customer !== undefined ? overrides.customer : CUSTOMER,
    save: async (c) => c,
  }
  return { tenantRepo, serviceRepo, slotRepo, bookingRepo, customerRepo }
}

describe('CreateBookingUseCase', () => {
  const validInput = {
    tenantSlug: 'peluqueria-juan',
    slotIds: ['s1'],
    serviceId: 'svc-1',
    customerEmail: 'ana@example.com',
    customerName: 'Ana',
  }

  it('creates a single-slot booking with fixed pricing', async () => {
    const repos = createMockRepos()
    const useCase = new CreateBookingUseCase(
      repos.tenantRepo, repos.serviceRepo, repos.slotRepo,
      repos.bookingRepo, repos.customerRepo
    )

    const booking = await useCase.execute(validInput)

    expect(booking.tenantId).toBe('tenant-1')
    expect(booking.slotIds).toEqual(['s1'])
    expect(booking.totalPrice.equals(new Money(1500, 'EUR'))).toBe(true)
    expect(booking.status).toBe(BookingStatus.PENDING)
  })

  it('creates consecutive-slot booking', async () => {
    const repos = createMockRepos()
    const useCase = new CreateBookingUseCase(
      repos.tenantRepo, repos.serviceRepo, repos.slotRepo,
      repos.bookingRepo, repos.customerRepo
    )

    const booking = await useCase.execute({
      ...validInput,
      slotIds: ['s1', 's2'],
    })

    expect(booking.slotIds).toEqual(['s1', 's2'])
  })

  it('calculates duration-based pricing', async () => {
    const repos = createMockRepos({ service: DURATION_SERVICE })
    const useCase = new CreateBookingUseCase(
      repos.tenantRepo, repos.serviceRepo, repos.slotRepo,
      repos.bookingRepo, repos.customerRepo
    )

    const booking = await useCase.execute({
      ...validInput,
      slotIds: ['s1', 's2'], // 60 min total
      serviceId: 'svc-2',
    })

    expect(booking.totalPrice.equals(new Money(5000, 'EUR'))).toBe(true)
  })

  it('rejects non-consecutive slots', async () => {
    const repos = createMockRepos()
    const useCase = new CreateBookingUseCase(
      repos.tenantRepo, repos.serviceRepo, repos.slotRepo,
      repos.bookingRepo, repos.customerRepo
    )

    await expect(
      useCase.execute({ ...validInput, slotIds: ['s1', 's3'] }) // gap between s1 and s3
    ).rejects.toThrow(BookingConflictError)
  })

  it('rejects when total duration exceeds max', async () => {
    const repos = createMockRepos()
    const useCase = new CreateBookingUseCase(
      repos.tenantRepo, repos.serviceRepo, repos.slotRepo,
      repos.bookingRepo, repos.customerRepo
    )

    // 4 slots × 30min = 120min = max, OK. But config max is 120, so this is at the limit.
    // Let's test exceeding: use a config with max 60
    const tightConfig = new TenantBookingConfig({
      allowConsecutiveSlots: true,
      maxBookingDurationMinutes: 60,
      minBookingDurationMinutes: 30,
    })
    const tightTenant: Tenant = { ...TENANT, bookingConfig: tightConfig }
    const repos2 = createMockRepos({ tenant: tightTenant })
    const useCase2 = new CreateBookingUseCase(
      repos2.tenantRepo, repos2.serviceRepo, repos2.slotRepo,
      repos2.bookingRepo, repos2.customerRepo
    )

    await expect(
      useCase2.execute({ ...validInput, slotIds: ['s1', 's2', 's3'] }) // 90min > 60 max
    ).rejects.toThrow(ServiceDoesNotFitError)
  })

  it('rejects when slot is already booked', async () => {
    const existingBooking: Booking = {
      id: 'existing',
      tenantId: 'tenant-1',
      serviceId: 'svc-1',
      customerId: 'c2',
      date: '2026-02-23',
      slotIds: ['s1'],
      startDateTime: new Date(Date.UTC(2026, 1, 23, 9, 0)),
      endDateTime: new Date(Date.UTC(2026, 1, 23, 9, 30)),
      totalPrice: new Money(1500, 'EUR'),
      status: BookingStatus.CONFIRMED,
      createdAt: new Date(),
    }
    const repos = createMockRepos({ bookings: [existingBooking] })
    const useCase = new CreateBookingUseCase(
      repos.tenantRepo, repos.serviceRepo, repos.slotRepo,
      repos.bookingRepo, repos.customerRepo
    )

    await expect(useCase.execute(validInput)).rejects.toThrow(
      BookingConflictError
    )
  })

  it('rejects consecutive slots when config disallows it', async () => {
    const noConsecConfig = new TenantBookingConfig({
      allowConsecutiveSlots: false,
      maxBookingDurationMinutes: 120,
    })
    const tenant: Tenant = { ...TENANT, bookingConfig: noConsecConfig }
    const repos = createMockRepos({ tenant })
    const useCase = new CreateBookingUseCase(
      repos.tenantRepo, repos.serviceRepo, repos.slotRepo,
      repos.bookingRepo, repos.customerRepo
    )

    await expect(
      useCase.execute({ ...validInput, slotIds: ['s1', 's2'] })
    ).rejects.toThrow(BookingConflictError)
  })

  it('throws TenantNotFoundError for unknown tenant', async () => {
    const repos = createMockRepos({ tenant: null })
    const useCase = new CreateBookingUseCase(
      repos.tenantRepo, repos.serviceRepo, repos.slotRepo,
      repos.bookingRepo, repos.customerRepo
    )

    await expect(useCase.execute(validInput)).rejects.toThrow(TenantNotFoundError)
  })

  it('creates new customer when not found', async () => {
    const repos = createMockRepos({ customer: null })
    const saveSpy = vi.spyOn(repos.customerRepo, 'save')
    const useCase = new CreateBookingUseCase(
      repos.tenantRepo, repos.serviceRepo, repos.slotRepo,
      repos.bookingRepo, repos.customerRepo
    )

    await useCase.execute(validInput)

    expect(saveSpy).toHaveBeenCalledOnce()
  })

  it('allows booking without service (serviceId = null)', async () => {
    const repos = createMockRepos()
    const useCase = new CreateBookingUseCase(
      repos.tenantRepo, repos.serviceRepo, repos.slotRepo,
      repos.bookingRepo, repos.customerRepo
    )

    const booking = await useCase.execute({
      ...validInput,
      serviceId: null,
    })

    expect(booking.serviceId).toBeNull()
    expect(booking.totalPrice.equals(new Money(0, 'EUR'))).toBe(true)
  })
})
```

**Step 2: Run to verify fail**

**Step 3: Implement**

```typescript
import type { TenantRepository } from '../ports/tenant-repository'
import type { ServiceRepository } from '../ports/service-repository'
import type { SlotDefinitionRepository } from '../ports/slot-definition-repository'
import type { BookingRepository } from '../ports/booking-repository'
import type { CustomerRepository } from '../ports/customer-repository'
import type { Booking } from '@/domain/entities/booking'
import { Money } from '@/domain/value-objects/money'
import {
  areConsecutive,
  totalDurationMinutes,
  isValidBookingDuration,
} from '@/domain/services/availability-calculator'
import { BookingStatus } from '@/domain/types'
import {
  TenantNotFoundError,
  ServiceNotFoundError,
  ServiceDoesNotFitError,
  BookingConflictError,
} from '@/domain/errors/domain-errors'

export interface CreateBookingInput {
  tenantSlug: string
  slotIds: string[]
  serviceId: string | null
  customerEmail: string
  customerName: string
}

export class CreateBookingUseCase {
  constructor(
    private readonly tenantRepo: TenantRepository,
    private readonly serviceRepo: ServiceRepository,
    private readonly slotRepo: SlotDefinitionRepository,
    private readonly bookingRepo: BookingRepository,
    private readonly customerRepo: CustomerRepository
  ) {}

  async execute(input: CreateBookingInput): Promise<Booking> {
    const tenant = await this.tenantRepo.findBySlug(input.tenantSlug)
    if (!tenant) throw new TenantNotFoundError(input.tenantSlug)

    // Resolve slots
    const slots = await this.slotRepo.findByIds(input.slotIds)
    if (slots.length !== input.slotIds.length) {
      throw new BookingConflictError('One or more slots not found')
    }

    // Validate consecutive
    if (slots.length > 1) {
      if (!tenant.bookingConfig.allowConsecutiveSlots) {
        throw new BookingConflictError(
          'Consecutive slot selection is not allowed for this business'
        )
      }
      if (!areConsecutive(slots)) {
        throw new BookingConflictError('Selected slots are not consecutive')
      }
    }

    // Validate duration
    const duration = totalDurationMinutes(slots)
    if (!isValidBookingDuration(duration, tenant.bookingConfig)) {
      throw new ServiceDoesNotFitError(
        duration,
        `${duration}min (allowed: ${tenant.bookingConfig.minBookingDurationMinutes ?? 0}-${tenant.bookingConfig.maxBookingDurationMinutes}min)`
      )
    }

    // Check no slots are already booked
    const sorted = [...slots].sort(
      (a, b) => a.startDateTime.getTime() - b.startDateTime.getTime()
    )
    const date = sorted[0].startDateTime.toISOString().split('T')[0]
    const existingBookings = await this.bookingRepo.findByTenantAndDate(
      tenant.id,
      date
    )
    const bookedSlotIds = new Set(existingBookings.flatMap((b) => b.slotIds))
    const conflict = input.slotIds.find((id) => bookedSlotIds.has(id))
    if (conflict) {
      throw new BookingConflictError(`Slot ${conflict} is already booked`)
    }

    // Resolve service + calculate price
    let totalPrice = new Money(0, tenant.currency)
    let serviceId: string | null = input.serviceId

    if (input.serviceId) {
      const service = await this.serviceRepo.findById(input.serviceId)
      if (!service || service.tenantId !== tenant.id) {
        throw new ServiceNotFoundError(input.serviceId)
      }
      totalPrice = service.pricing.calculatePrice(duration)
    }

    // Resolve customer
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
      serviceId,
      customerId: customer.id,
      date,
      slotIds: input.slotIds,
      startDateTime: sorted[0].startDateTime,
      endDateTime: sorted[sorted.length - 1].endDateTime,
      totalPrice,
      status: BookingStatus.PENDING,
      createdAt: new Date(),
    }

    return this.bookingRepo.save(booking)
  }
}
```

**Step 4: Run to verify pass**

**Step 5: Run full suite**

Run: `npm test`
Expected: All tests pass.

**Step 6: Commit**

```bash
git add src/application/use-cases/create-booking.ts src/application/use-cases/create-booking.test.ts
git commit -m "refactor(application): rewrite CreateBookingUseCase for slot-first model with TDD"
```

---

## Phase D: Cleanup

### Task R9: Remove deprecated code + final verification

**Files:**
- Delete: `src/domain/entities/weekly-schedule.ts`
- Delete: `src/domain/entities/weekly-schedule.test.ts`
- Modify: `src/application/ports/schedule-repository.ts` → delete file

**Step 1: Remove WeeklySchedule and ScheduleRepository**

These are replaced by `SlotDefinition` + `SlotDefinitionRepository`.

**Step 2: Run full test suite**

Run: `npm test`
Expected: All tests pass (no remaining code depends on deleted files).

**Step 3: Commit**

```bash
git rm src/domain/entities/weekly-schedule.ts src/domain/entities/weekly-schedule.test.ts src/application/ports/schedule-repository.ts
git commit -m "refactor: remove WeeklySchedule, replaced by SlotDefinition model"
```

---

## Architecture Summary (Post-Refactor)

```
src/
├── domain/
│   ├── types.ts                          ← Currency, Locale, DayOfWeek, BookingStatus
│   ├── errors/domain-errors.ts           ← Error hierarchy
│   ├── value-objects/
│   │   ├── time-range.ts                 ← Kept (useful for future templates)
│   │   ├── money.ts                      ← Monetary values
│   │   ├── slug.ts                       ← URL slugs
│   │   ├── tenant-booking-config.ts      ← NEW: extensible booking configuration
│   │   └── pricing-strategy.ts           ← NEW: Fixed + DurationBased pricing
│   ├── entities/
│   │   ├── tenant.ts                     ← Updated: includes bookingConfig
│   │   ├── service.ts                    ← Updated: uses PricingStrategy
│   │   ├── customer.ts                   ← Unchanged
│   │   ├── booking.ts                    ← Updated: slotIds[] + totalPrice
│   │   └── slot-definition.ts            ← NEW: concrete datetime slots
│   └── services/
│       └── availability-calculator.ts    ← Rewritten: slot-based availability
├── application/
│   ├── ports/
│   │   ├── tenant-repository.ts
│   │   ├── service-repository.ts
│   │   ├── slot-definition-repository.ts ← NEW
│   │   ├── booking-repository.ts
│   │   └── customer-repository.ts
│   └── use-cases/
│       ├── get-availability.ts           ← Rewritten: returns slot definitions
│       └── create-booking.ts             ← Rewritten: slot-based with pricing
```

**Extension points (no code changes needed to add):**
- New `PricingStrategy` variant → implement interface, plug in
- New `TenantBookingConfig` fields → add property, existing code unaffected
- Schedule templates → generate `SlotDefinition[]` from patterns, feed into existing repos
- Multiple professionals → add `professionalId` to `SlotDefinition`, group by it
- Buffer time → add `bufferMinutes` to `TenantBookingConfig`, apply in `CreateBookingUseCase`
