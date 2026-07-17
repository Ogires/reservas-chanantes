# Critical Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the 4 production-blocking issues found in the 2026-04-22 review: booking race condition, missing email validation, cron reminder duplicates, and missing error/loading boundaries.

**Architecture:** Apply fixes at the correct architectural layer (domain, infrastructure, UI). Push race-prevention down to the database (authoritative source), keep validation in the domain layer, and use Next.js native `error.tsx`/`loading.tsx` conventions for UX boundaries.

**Tech Stack:** Next.js 16.1.6 (App Router), React 19.2, TypeScript strict, Supabase Postgres, Vitest 4, Tailwind 4.

**Working Directory:** `F:\2026\Master\TFM\Op03-cl\booking-saas`

**Commands:**
- Tests: `cd booking-saas && npm test`
- Type check: `cd booking-saas && npx tsc --noEmit`
- Lint: `cd booking-saas && npm run lint`
- Dev: `cd booking-saas && npm run dev`
- DB migrations: apply via Supabase CLI or dashboard SQL editor

**Commit style:** conventional commits (`fix:`, `feat:`, `test:`, `chore:`). One logical change per commit. **Never include Co-Authored-By.**

---

## Task A — C4: Error & Loading Boundaries (UI-only, no DB)

**Why first:** Lowest blast radius, no domain changes, builds momentum. Fixes user-facing "white screen of death" on any runtime error.

**Files:**
- Create: `booking-saas/src/app/global-error.tsx`
- Create: `booking-saas/src/app/[slug]/error.tsx`
- Create: `booking-saas/src/app/[slug]/loading.tsx`
- Create: `booking-saas/src/app/admin/(dashboard)/error.tsx`
- Create: `booking-saas/src/app/admin/(dashboard)/loading.tsx`
- Create: `booking-saas/src/app/my/(portal)/error.tsx`
- Create: `booking-saas/src/app/my/(portal)/loading.tsx`

### Step A.1: Create public page error boundary (`[slug]`)

Create `booking-saas/src/app/[slug]/error.tsx`:

```tsx
'use client'

import { useEffect } from 'react'

export default function SlugError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[slug] route error:', error)
  }, [error])

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="mb-4 font-serif text-3xl text-slate-900">
        Algo no ha ido bien
      </h1>
      <p className="mb-8 text-slate-600">
        No hemos podido cargar esta página. Inténtalo de nuevo en unos segundos.
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-teal-600 px-6 py-3 font-medium text-white transition hover:bg-teal-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
      >
        Reintentar
      </button>
    </main>
  )
}
```

### Step A.2: Create public page loading skeleton

Create `booking-saas/src/app/[slug]/loading.tsx`:

```tsx
export default function SlugLoading() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12" aria-busy="true" aria-live="polite">
      <div className="animate-pulse space-y-6">
        <div className="h-10 w-2/3 rounded bg-slate-200" />
        <div className="h-4 w-full rounded bg-slate-200" />
        <div className="h-4 w-5/6 rounded bg-slate-200" />
        <div className="mt-8 space-y-3">
          <div className="h-24 rounded-lg bg-slate-200" />
          <div className="h-24 rounded-lg bg-slate-200" />
          <div className="h-24 rounded-lg bg-slate-200" />
        </div>
      </div>
      <span className="sr-only">Cargando…</span>
    </main>
  )
}
```

### Step A.3: Create admin dashboard error boundary

Create `booking-saas/src/app/admin/(dashboard)/error.tsx`:

```tsx
'use client'

import { useEffect } from 'react'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[admin] dashboard error:', error)
  }, [error])

  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 p-6">
      <h2 className="mb-2 text-lg font-semibold text-rose-900">
        Error en el panel
      </h2>
      <p className="mb-4 text-sm text-rose-800">
        Ha ocurrido un problema cargando esta sección.
      </p>
      <button
        onClick={reset}
        className="rounded border border-rose-300 bg-white px-4 py-2 text-sm font-medium text-rose-900 transition hover:bg-rose-100"
      >
        Reintentar
      </button>
    </div>
  )
}
```

### Step A.4: Create admin dashboard loading skeleton

Create `booking-saas/src/app/admin/(dashboard)/loading.tsx`:

```tsx
export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-live="polite">
      <div className="h-8 w-1/3 rounded bg-slate-200" />
      <div className="h-48 rounded-lg bg-slate-200" />
      <span className="sr-only">Cargando…</span>
    </div>
  )
}
```

### Step A.5: Create customer portal error boundary

Create `booking-saas/src/app/my/(portal)/error.tsx`:

```tsx
'use client'

import { useEffect } from 'react'

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[portal] error:', error)
  }, [error])

  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 p-6">
      <h2 className="mb-2 text-lg font-semibold text-rose-900">
        No hemos podido cargar tu información
      </h2>
      <p className="mb-4 text-sm text-rose-800">
        Por favor, inténtalo de nuevo. Si el problema persiste, cierra sesión y vuelve a entrar.
      </p>
      <button
        onClick={reset}
        className="rounded border border-rose-300 bg-white px-4 py-2 text-sm font-medium text-rose-900 transition hover:bg-rose-100"
      >
        Reintentar
      </button>
    </div>
  )
}
```

### Step A.6: Create customer portal loading skeleton

Create `booking-saas/src/app/my/(portal)/loading.tsx`:

```tsx
export default function PortalLoading() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-live="polite">
      <div className="h-6 w-1/4 rounded bg-slate-200" />
      <div className="space-y-3">
        <div className="h-20 rounded-lg bg-slate-200" />
        <div className="h-20 rounded-lg bg-slate-200" />
      </div>
      <span className="sr-only">Cargando…</span>
    </div>
  )
}
```

### Step A.7: Create global error boundary (root layout)

Create `booking-saas/src/app/global-error.tsx`:

```tsx
'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[global] error:', error)
  }, [error])

  return (
    <html lang="es">
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
          Error inesperado
        </h1>
        <p style={{ marginBottom: '1.5rem', color: '#475569' }}>
          La aplicación ha encontrado un error. Recarga la página para volver a intentarlo.
        </p>
        <button
          onClick={reset}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#0d9488',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
          }}
        >
          Recargar
        </button>
      </body>
    </html>
  )
}
```

### Step A.8: Verify type check passes

Run: `cd booking-saas && npx tsc --noEmit`
Expected: No errors.

### Step A.9: Manual smoke test

Run: `cd booking-saas && npm run dev`. Then:
1. Navigate to `/test-slug-that-does-not-exist` — should hit `notFound()` handling, not the error boundary.
2. Temporarily throw in `[slug]/page.tsx`: add `throw new Error('test')` at the top of the default export. Load the page → you should see the Spanish error UI with "Reintentar" button. Remove the throw after verifying.
3. Repeat for admin and portal.

### Step A.10: Commit

```bash
cd booking-saas && git add src/app/global-error.tsx src/app/\[slug\]/error.tsx src/app/\[slug\]/loading.tsx "src/app/admin/(dashboard)/error.tsx" "src/app/admin/(dashboard)/loading.tsx" "src/app/my/(portal)/error.tsx" "src/app/my/(portal)/loading.tsx"
git commit -m "feat: add error and loading boundaries for public, admin and portal routes"
```

---

## Task B — C2: Email Validation in Booking Flow

**Why:** Silent delivery failures — malformed emails are accepted at the public booking form, stored in DB, and confirmation/reminder emails fail without telling the customer.

**Strategy:** Create a domain `EmailAddress` value object (TDD), wire it into `CreateBookingUseCase` after the existing phone validation, add `InvalidEmailError`, map it in the `/[slug]/actions.ts` server action.

**Files:**
- Create: `booking-saas/src/domain/value-objects/email-address.ts`
- Create: `booking-saas/src/domain/value-objects/email-address.test.ts`
- Modify: `booking-saas/src/domain/errors/domain-errors.ts` (add `InvalidEmailError`)
- Modify: `booking-saas/src/application/use-cases/create-booking.ts` (validate email)
- Modify: `booking-saas/src/application/use-cases/create-booking.test.ts` (add 2 cases)

### Step B.1: Write failing tests for `EmailAddress`

Create `booking-saas/src/domain/value-objects/email-address.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { EmailAddress } from './email-address'
import { InvalidEmailError } from '@/domain/errors/domain-errors'

describe('EmailAddress', () => {
  it('accepts a valid email and normalizes to lowercase', () => {
    const email = EmailAddress.create('User@Example.COM')
    expect(email.value).toBe('user@example.com')
  })

  it('trims surrounding whitespace', () => {
    const email = EmailAddress.create('  ana@example.com  ')
    expect(email.value).toBe('ana@example.com')
  })

  it.each([
    '',
    '   ',
    'plainaddress',
    '@missing-local.com',
    'missing-at.com',
    'missing-domain@',
    'a@b',
    'spaces in@local.com',
    'double@@at.com',
    'trailing.dot@example.com.',
  ])('rejects invalid email %j', (invalid) => {
    expect(() => EmailAddress.create(invalid)).toThrow(InvalidEmailError)
  })

  it('accepts plus-addressed emails', () => {
    expect(() => EmailAddress.create('ana+tag@example.com')).not.toThrow()
  })

  it('accepts subdomains', () => {
    expect(() => EmailAddress.create('ana@mail.example.co.uk')).not.toThrow()
  })

  it('rejects emails longer than 254 characters (RFC 5321)', () => {
    const local = 'a'.repeat(64)
    const domain = 'b'.repeat(190) + '.com'
    const tooLong = `${local}@${domain}` // > 254
    expect(() => EmailAddress.create(tooLong)).toThrow(InvalidEmailError)
  })
})
```

### Step B.2: Add `InvalidEmailError` to domain errors

Modify `booking-saas/src/domain/errors/domain-errors.ts`. Add this class right below `InvalidPhoneError` (around line 100):

```typescript
export class InvalidEmailError extends DomainError {
  constructor(email: string) {
    super(`Invalid email address: "${email}"`)
  }
}
```

### Step B.3: Run test to confirm it fails

Run: `cd booking-saas && npm test -- email-address`
Expected: FAIL with "Cannot find module './email-address'".

### Step B.4: Implement `EmailAddress`

Create `booking-saas/src/domain/value-objects/email-address.ts`:

```typescript
import { InvalidEmailError } from '@/domain/errors/domain-errors'

// RFC-lite: requires local part, @, domain with at least one dot, no consecutive dots, no leading/trailing dot.
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/

export class EmailAddress {
  private constructor(public readonly value: string) {}

  static create(raw: string): EmailAddress {
    const trimmed = (raw ?? '').trim().toLowerCase()
    if (trimmed.length === 0 || trimmed.length > 254) {
      throw new InvalidEmailError(raw)
    }
    if (trimmed.includes('..')) {
      throw new InvalidEmailError(raw)
    }
    if (!EMAIL_REGEX.test(trimmed)) {
      throw new InvalidEmailError(raw)
    }
    return new EmailAddress(trimmed)
  }
}
```

### Step B.5: Run tests to confirm they pass

Run: `cd booking-saas && npm test -- email-address`
Expected: All tests PASS.

### Step B.6: Wire `EmailAddress` into `CreateBookingUseCase`

Modify `booking-saas/src/application/use-cases/create-booking.ts`:

1. Add import at the top:
   ```typescript
   import { EmailAddress } from '@/domain/value-objects/email-address'
   ```

2. After the existing phone validation block (lines 96-99), add:
   ```typescript
   const normalizedEmail = EmailAddress.create(input.customerEmail).value
   ```

3. Replace `input.customerEmail` with `normalizedEmail` in the two places that use it:
   - `customerRepo.findByEmail(...)` (currently line 101)
   - `customer = await this.customerRepo.save({...email: normalizedEmail...})` (currently line 106)

The resulting block should look like:
```typescript
const phoneDigits = input.customerPhone.replace(/\D/g, '')
if (phoneDigits.length < 6) {
  throw new InvalidPhoneError(input.customerPhone)
}

const normalizedEmail = EmailAddress.create(input.customerEmail).value

let customer = await this.customerRepo.findByEmail(normalizedEmail)
if (!customer) {
  customer = await this.customerRepo.save({
    id: crypto.randomUUID(),
    name: input.customerName,
    email: normalizedEmail,
    phone: input.customerPhone,
  })
}
```

### Step B.7: Add failing tests to `create-booking.test.ts`

Modify `booking-saas/src/application/use-cases/create-booking.test.ts`. Add to the existing imports at line 17-25:

```typescript
  InvalidEmailError,
```

Add these two tests inside the `describe('CreateBookingUseCase', ...)` block, after the existing `InvalidPhoneError` test (after line 259):

```typescript
  it('throws InvalidEmailError when email is malformed', async () => {
    const repos = createMockRepos()
    const useCase = new CreateBookingUseCase(
      repos.tenantRepo,
      repos.serviceRepo,
      repos.scheduleRepo,
      repos.bookingRepo,
      repos.customerRepo
    )

    await expect(
      useCase.execute({ ...validInput, customerEmail: 'not-an-email' })
    ).rejects.toThrow(InvalidEmailError)
  })

  it('normalizes customer email to lowercase before lookup', async () => {
    const repos = createMockRepos({ customer: null })
    const findByEmailSpy = vi.spyOn(repos.customerRepo, 'findByEmail')
    const useCase = new CreateBookingUseCase(
      repos.tenantRepo,
      repos.serviceRepo,
      repos.scheduleRepo,
      repos.bookingRepo,
      repos.customerRepo
    )

    await useCase.execute({ ...validInput, customerEmail: 'Ana@Example.COM' })

    expect(findByEmailSpy).toHaveBeenCalledWith('ana@example.com')
  })
```

### Step B.8: Run all tests

Run: `cd booking-saas && npm test`
Expected: All tests PASS (existing + 7 new email tests + 2 new create-booking tests).

### Step B.9: Type check

Run: `cd booking-saas && npx tsc --noEmit`
Expected: No errors.

### Step B.10: Commit

```bash
cd booking-saas && git add src/domain/value-objects/email-address.ts src/domain/value-objects/email-address.test.ts src/domain/errors/domain-errors.ts src/application/use-cases/create-booking.ts src/application/use-cases/create-booking.test.ts
git commit -m "feat: validate customer email in booking flow with EmailAddress value object"
```

---

## Task C — C1: Booking Slot Race Condition

**Why:** Two concurrent requests for the same slot both pass the application-level availability check and both INSERT. Without a DB constraint, the DB has no defense.

**Strategy:**
1. Enable `btree_gist` extension in Postgres (Supabase supports it).
2. Add an `EXCLUDE` constraint on `bookings` that prevents overlapping time ranges per `(tenant_id, date)` for non-cancelled bookings.
3. In the repository's `save()`, detect the constraint violation (Postgres error code `23P01`) and map it to a domain error.
4. Add `SlotTakenError` to domain errors.
5. Map it in the `[slug]/actions.ts` server action to return a user-friendly message ("Ese hueco se acaba de ocupar").
6. Add a regression test at the use-case level (injected repo throws `SlotTakenError`) + optional integration test (skipped by default, runs against a real Supabase instance).

**Files:**
- Create: `booking-saas/supabase/migrations/20260422_prevent_booking_overlap.sql`
- Modify: `booking-saas/src/domain/errors/domain-errors.ts` (add `SlotTakenError`)
- Modify: `booking-saas/src/infrastructure/supabase/booking-repository.ts` (catch 23P01 in `save`)
- Modify: `booking-saas/src/app/[slug]/actions.ts` (map `SlotTakenError` to friendly message)

### Step C.1: Write the migration SQL

Create `booking-saas/supabase/migrations/20260422_prevent_booking_overlap.sql`:

```sql
-- Prevent concurrent bookings from occupying overlapping time ranges
-- for the same tenant+date. Cancelled bookings are excluded so a freed
-- slot can be re-booked.

create extension if not exists btree_gist;

alter table public.bookings
  add constraint bookings_no_overlap
  exclude using gist (
    tenant_id with =,
    date with =,
    int4range(start_minutes, end_minutes, '[)') with &&
  )
  where (status <> 'CANCELLED');
```

### Step C.2: Apply the migration

Run (using the Supabase CLI):
```bash
cd booking-saas && npx supabase db push
```

Or, if applying manually via the Supabase dashboard: paste the contents of the migration file into the SQL editor and run it.

Expected: No error. Verify with:
```sql
select conname from pg_constraint where conname = 'bookings_no_overlap';
```
Expected output: one row returning `bookings_no_overlap`.

**Important:** If the database already contains overlapping bookings (dev/staging data), the constraint creation will fail. Run this first to identify them:
```sql
select a.id, b.id
from public.bookings a
join public.bookings b
  on a.tenant_id = b.tenant_id
 and a.date = b.date
 and a.id < b.id
 and a.status <> 'CANCELLED'
 and b.status <> 'CANCELLED'
 and int4range(a.start_minutes, a.end_minutes, '[)') && int4range(b.start_minutes, b.end_minutes, '[)');
```
Cancel or delete duplicates before applying the constraint.

### Step C.3: Add `SlotTakenError` to domain errors

Modify `booking-saas/src/domain/errors/domain-errors.ts`. Add below `BookingConflictError` (around line 58):

```typescript
export class SlotTakenError extends DomainError {
  constructor() {
    super('This slot was just taken by another customer')
  }
}
```

### Step C.4: Update repository to catch the constraint violation

Modify `booking-saas/src/infrastructure/supabase/booking-repository.ts`. Add import at the top:

```typescript
import { SlotTakenError } from '@/domain/errors/domain-errors'
```

Replace the `save` method (currently lines 83-101) with:

```typescript
async save(booking: Booking): Promise<Booking> {
  const { data, error } = await this.supabase
    .from('bookings')
    .insert({
      id: booking.id,
      tenant_id: booking.tenantId,
      service_id: booking.serviceId,
      customer_id: booking.customerId,
      date: booking.date,
      start_minutes: booking.timeRange.start,
      end_minutes: booking.timeRange.end,
      status: booking.status,
    })
    .select()
    .single()

  if (error) {
    // 23P01 = exclusion_violation (Postgres)
    if (error.code === '23P01') {
      throw new SlotTakenError()
    }
    throw new Error(`Failed to save booking: ${error.message}`)
  }
  return toDomain(data)
}
```

### Step C.5: Map `SlotTakenError` in public booking action

Modify `booking-saas/src/app/[slug]/actions.ts`. In the catch block of `createBooking`, before returning a generic error, check for `SlotTakenError`:

First, add the import at the top of the file:
```typescript
import { SlotTakenError } from '@/domain/errors/domain-errors'
```

Then, in the catch block (around line 95-100), replace the existing handler with:

```typescript
} catch (e) {
  if (e instanceof SlotTakenError) {
    return {
      success: false,
      error: 'Ese hueco se acaba de ocupar. Elige otro.',
      slotTaken: true,
    }
  }
  // Log server-side; return generic message to avoid leaking internals.
  console.error('[createBooking] unexpected error:', e)
  return {
    success: false,
    error: e instanceof Error ? e.message : 'No se ha podido crear la reserva',
  }
}
```

(Note: if the existing return type of `createBooking` doesn't include `slotTaken?: boolean`, widen it in the type declaration.)

### Step C.6: Write a repository regression test

Create `booking-saas/src/infrastructure/supabase/booking-repository.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { SupabaseBookingRepository } from './booking-repository'
import { SlotTakenError } from '@/domain/errors/domain-errors'
import { TimeRange } from '@/domain/value-objects/time-range'
import { BookingStatus } from '@/domain/types'
import type { Booking } from '@/domain/entities/booking'

function makeBooking(): Booking {
  return {
    id: 'bk-1',
    tenantId: 't-1',
    serviceId: 's-1',
    customerId: 'c-1',
    date: '2026-05-01',
    timeRange: new TimeRange(540, 570),
    status: BookingStatus.PENDING,
    createdAt: new Date(),
  }
}

describe('SupabaseBookingRepository.save', () => {
  it('throws SlotTakenError when Postgres returns exclusion_violation (23P01)', async () => {
    const single = vi.fn().mockResolvedValue({
      data: null,
      error: { code: '23P01', message: 'conflicting key value violates exclusion constraint' },
    })
    const select = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select })
    const from = vi.fn().mockReturnValue({ insert })
    const supabase = { from } as unknown as Parameters<typeof SupabaseBookingRepository.prototype.constructor>[0]

    const repo = new SupabaseBookingRepository(supabase as never)

    await expect(repo.save(makeBooking())).rejects.toThrow(SlotTakenError)
  })

  it('re-throws other errors as generic Error', async () => {
    const single = vi.fn().mockResolvedValue({
      data: null,
      error: { code: '23505', message: 'duplicate key' },
    })
    const select = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select })
    const from = vi.fn().mockReturnValue({ insert })
    const supabase = { from } as unknown as Parameters<typeof SupabaseBookingRepository.prototype.constructor>[0]

    const repo = new SupabaseBookingRepository(supabase as never)

    await expect(repo.save(makeBooking())).rejects.toThrow(/Failed to save booking/)
  })
})
```

### Step C.7: Run test to confirm it fails initially

If Step C.4 was applied correctly, this should actually PASS. If you want to verify TDD-style:
1. Temporarily comment out the `if (error.code === '23P01')` branch in the repository.
2. Run: `cd booking-saas && npm test -- booking-repository`
3. Expected: FAIL.
4. Uncomment the branch.
5. Re-run: PASS.

### Step C.8: Run all tests

Run: `cd booking-saas && npm test`
Expected: All tests PASS.

### Step C.9: Type check

Run: `cd booking-saas && npx tsc --noEmit`
Expected: No errors.

### Step C.10: Manual integration test (optional but recommended)

Against a staging Supabase:
1. Open two browser tabs on the same `/[slug]` booking page.
2. Select the same date and slot in both.
3. Submit both within 200ms (open devtools, paste the submit into console for precision).
4. Expected: one succeeds, one returns "Ese hueco se acaba de ocupar".

### Step C.11: Commit

```bash
cd booking-saas && git add supabase/migrations/20260422_prevent_booking_overlap.sql src/domain/errors/domain-errors.ts src/infrastructure/supabase/booking-repository.ts src/infrastructure/supabase/booking-repository.test.ts src/app/\[slug\]/actions.ts
git commit -m "fix: prevent concurrent booking overlaps via Postgres exclusion constraint"
```

---

## Task D — C3: Cron Reminder Duplicates

**Why:** Current flow is `send email` → `UPDATE reminder_sent_at`. If the UPDATE fails (timeout, lambda kill), the next cron run re-sends.

**Strategy:** Flip the order using an atomic claim:
1. Add a repository method `claimReminder(bookingId): boolean` that runs `UPDATE bookings SET reminder_sent_at = NOW() WHERE id = ? AND reminder_sent_at IS NULL RETURNING id` — returns `true` only if the row was updated (i.e., we won the race).
2. In the cron loop: `claim` → `send` → on send failure, `UPDATE reminder_sent_at = NULL` to release the claim for the next run.
3. If `claim` returns false, another invocation already took it — skip silently.

This is the standard "claim-and-release" pattern; it handles concurrent cron invocations, retries, and partial failures.

**Files:**
- Modify: `booking-saas/src/application/ports/booking-repository.ts` (add `claimReminder`, remove `updateReminderSentAt`)
- Modify: `booking-saas/src/infrastructure/supabase/booking-repository.ts` (implement new methods)
- Modify: `booking-saas/src/app/api/cron/send-reminders/route.ts` (use new flow)
- Modify: `booking-saas/src/application/use-cases/create-booking.test.ts` (update repo mock type)
- Create: `booking-saas/src/infrastructure/supabase/booking-repository-reminders.test.ts`

### Step D.1: Update the repository port

Modify `booking-saas/src/application/ports/booking-repository.ts`. Replace `updateReminderSentAt` with two new methods:

```typescript
// Remove:
//   updateReminderSentAt(id: string, sentAt: Date): Promise<void>
//
// Add:

/**
 * Atomically claim a booking for reminder sending.
 * Returns true if this call acquired the claim (reminder_sent_at was NULL
 * and is now set to `sentAt`). Returns false if another process already
 * claimed it.
 */
claimReminder(id: string, sentAt: Date): Promise<boolean>

/**
 * Release a previously-claimed reminder so it can be retried on the next
 * cron run. Called after a send failure.
 */
releaseReminder(id: string): Promise<void>
```

### Step D.2: Implement in the Supabase repository

Modify `booking-saas/src/infrastructure/supabase/booking-repository.ts`. Replace `updateReminderSentAt` (lines 149-157) with:

```typescript
async claimReminder(id: string, sentAt: Date): Promise<boolean> {
  const { data, error } = await this.supabase
    .from('bookings')
    .update({ reminder_sent_at: sentAt.toISOString() })
    .eq('id', id)
    .is('reminder_sent_at', null)
    .select('id')

  if (error) {
    throw new Error(`Failed to claim reminder: ${error.message}`)
  }
  return (data ?? []).length > 0
}

async releaseReminder(id: string): Promise<void> {
  const { error } = await this.supabase
    .from('bookings')
    .update({ reminder_sent_at: null })
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to release reminder: ${error.message}`)
  }
}
```

### Step D.3: Rewrite the cron handler

Modify `booking-saas/src/app/api/cron/send-reminders/route.ts`. Replace the `for (const booking of bookings)` loop (lines 29-55) with:

```typescript
let sent = 0
let skipped = 0
let failed = 0

for (const booking of bookings) {
  const claimed = await bookingRepo.claimReminder(booking.id, new Date())
  if (!claimed) {
    // Another invocation already handled this booking.
    skipped++
    continue
  }

  try {
    const [customer, service, tenant] = await Promise.all([
      customerRepo.findById(booking.customerId),
      serviceRepo.findById(booking.serviceId),
      tenantRepo.findById(booking.tenantId),
    ])

    if (!customer || !service || !tenant) {
      // Stale references — release claim so a future run can retry once the
      // referenced records exist, or be investigated manually.
      await bookingRepo.releaseReminder(booking.id)
      failed++
      continue
    }

    await notifications.sendBookingReminder({
      booking,
      customer,
      service,
      tenant,
    })
    sent++
  } catch (error) {
    console.error(
      `[send-reminders] Failed for booking ${booking.id}:`,
      error
    )
    // Roll back the claim so the next run retries.
    try {
      await bookingRepo.releaseReminder(booking.id)
    } catch (releaseErr) {
      console.error(
        `[send-reminders] Failed to release claim for ${booking.id}:`,
        releaseErr
      )
    }
    failed++
  }
}

return NextResponse.json({ sent, skipped, failed, total: bookings.length })
```

### Step D.4: Update mock repo in create-booking tests

Modify `booking-saas/src/application/use-cases/create-booking.test.ts` line 97-107. Replace the `bookingRepo` mock block:

```typescript
  const bookingRepo: BookingRepository = {
    findByTenantAndDate: async () => overrides?.bookings ?? [],
    findByTenantAndDateRange: async () => [],
    findById: async () => null,
    findByCustomerId: async () => [],
    save: async (b) => b,
    updateStatus: async () => {},
    updateStripeSessionId: async () => {},
    findConfirmedForDateWithoutReminder: async () => [],
    claimReminder: async () => true,
    releaseReminder: async () => {},
  }
```

Also update any other test files that mock `BookingRepository`. Check with:
```bash
cd booking-saas && grep -rn "updateReminderSentAt" src/
```
Expected after the fix: no remaining references.

### Step D.5: Write repository test

Create `booking-saas/src/infrastructure/supabase/booking-repository-reminders.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { SupabaseBookingRepository } from './booking-repository'

function mockSupabase(selectResult: { data: unknown[] | null; error: unknown }) {
  const select = vi.fn().mockResolvedValue(selectResult)
  const is = vi.fn().mockReturnValue({ select })
  const eq = vi.fn().mockReturnValue({ is })
  const update = vi.fn().mockReturnValue({ eq })
  const from = vi.fn().mockReturnValue({ update })
  return { from, spies: { update, eq, is, select } }
}

describe('SupabaseBookingRepository.claimReminder', () => {
  it('returns true when the row was updated (reminder was NULL)', async () => {
    const { from } = mockSupabase({ data: [{ id: 'bk-1' }], error: null })
    const repo = new SupabaseBookingRepository({ from } as never)

    const result = await repo.claimReminder('bk-1', new Date('2026-04-22T10:00:00Z'))

    expect(result).toBe(true)
  })

  it('returns false when no row was updated (already claimed)', async () => {
    const { from } = mockSupabase({ data: [], error: null })
    const repo = new SupabaseBookingRepository({ from } as never)

    const result = await repo.claimReminder('bk-1', new Date())

    expect(result).toBe(false)
  })

  it('throws when Supabase returns an error', async () => {
    const { from } = mockSupabase({ data: null, error: { message: 'boom' } })
    const repo = new SupabaseBookingRepository({ from } as never)

    await expect(repo.claimReminder('bk-1', new Date())).rejects.toThrow(
      /Failed to claim reminder/
    )
  })
})
```

### Step D.6: Run all tests

Run: `cd booking-saas && npm test`
Expected: All tests PASS.

### Step D.7: Type check

Run: `cd booking-saas && npx tsc --noEmit`
Expected: No errors.

### Step D.8: Manual smoke test against staging

1. Seed a booking for tomorrow with `reminder_sent_at = NULL`.
2. Trigger the cron manually:
   ```bash
   curl -X GET https://<staging-url>/api/cron/send-reminders \
     -H "Authorization: Bearer $CRON_SECRET"
   ```
3. Check response: `{ sent: 1, skipped: 0, failed: 0, total: 1 }`.
4. Trigger again immediately. Expected: `{ sent: 0, skipped: 1, failed: 0, total: 0 }` (0 total because the first run set `reminder_sent_at`, so the initial query excludes it — `skipped` stays at 0 normally; this verifies no duplicate send).
5. Manually reset `reminder_sent_at = NULL` on the booking. Trigger the cron with Resend API key temporarily invalidated to force a send failure. Expected: `failed: 1`, and the `reminder_sent_at` column is back to NULL (released).

### Step D.9: Commit

```bash
cd booking-saas && git add src/application/ports/booking-repository.ts src/infrastructure/supabase/booking-repository.ts src/infrastructure/supabase/booking-repository-reminders.test.ts src/app/api/cron/send-reminders/route.ts src/application/use-cases/create-booking.test.ts
# Also any other test files updated in D.4
git commit -m "fix: atomic claim for cron reminders to prevent duplicate sends on partial failures"
```

---

## Final Verification (after all 4 tasks)

Run full suite:
```bash
cd booking-saas && npm test && npx tsc --noEmit && npm run lint
```
Expected: all pass, no errors.

End-to-end manual smoke:
1. `npm run dev`
2. Public booking page: book a slot with a malformed email → friendly error.
3. Public booking page: book a slot normally → success.
4. Try to force an error in any dashboard page → error.tsx renders with "Reintentar".
5. Cron endpoint: trigger twice → second run reports 0 sent for already-reminded bookings.
6. Two-tab race test (Task C.10).

---

## Out of Scope (for follow-up PRs)

These were identified in the 2026-04-22 review but are NOT in this plan:

- **H1** Timezone `dayOfWeek` bug (affects non-EU tenants only) — separate domain service refactor.
- **H2-H3** Error message leakage in login + public actions — low-risk cosmetic fix.
- **H4** Open redirect in password reset — needs env var setup.
- **H5** `export const dynamic = 'force-dynamic'` on webhook routes — one-liner follow-up.
- **M1-M7** Tenant isolation, rate-limit, HTML escaping in emails, Stripe idempotency, OAuth state CSRF — each its own PR.
- **UX1-9** A11y + design polish — separate UX pass.

---

## Rollback

Each task is a separate commit and can be reverted independently.

- Task A (UI boundaries): pure add — safe to revert without side-effects.
- Task B (email validation): reverting re-opens bad-email bookings; apply a data-cleanup script first if production data was created post-deploy.
- Task C (DB constraint): to revert, run `alter table public.bookings drop constraint bookings_no_overlap;` then `git revert`. The extension can stay.
- Task D (cron claim): reverting restores the old duplicate-send risk; no data migration needed.
