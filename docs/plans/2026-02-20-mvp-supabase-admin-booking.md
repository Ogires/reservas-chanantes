# MVP Implementation Plan: Supabase + Admin Panel + Public Booking

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deliver a working end-to-end MVP where tenant owners register, configure services/schedules, and customers book through a public page.

**Architecture:** Server Actions call use cases with Supabase repository implementations. Next.js 16 App Router with `proxy.ts` for auth. Route group `(dashboard)` for sidebar-wrapped admin pages.

**Tech Stack:** Next.js 16.1.6, React 19, Supabase (Auth + PostgreSQL + RLS), Tailwind CSS 4, TypeScript strict

---

## Context

The domain + application layers are complete (78 tests, 11 commits). Infrastructure and presentation layers are empty stubs. The user has a Supabase cloud project ready. We need to:
1. Extend existing ports for admin CRUD operations
2. Implement Supabase repository adapters
3. Build admin panel (register, login, services CRUD, schedule config)
4. Build public booking page (service selection, date picker, slot grid, booking form)

**Key principle:** Keep the CURRENT domain model (TimeRange/WeeklySchedule/algorithmic 30-min slots). Do NOT implement the deferred slot-first refactor.

---

## Phase 0: Domain + Port Amendments

### Task 1: Add `ownerId` to Tenant entity

**Files:**
- Modify: `src/domain/entities/tenant.ts`
- Modify: `src/application/use-cases/get-availability.test.ts` (TENANT fixture)
- Modify: `src/application/use-cases/create-booking.test.ts` (TENANT fixture)

**Step 1: Update Tenant interface**

```typescript
// src/domain/entities/tenant.ts
import type { Currency, Locale } from '../types'

export interface Tenant {
  readonly id: string
  readonly ownerId: string
  readonly name: string
  readonly slug: string
  readonly currency: Currency
  readonly defaultLocale: Locale
  readonly createdAt: Date
}
```

**Step 2: Add `ownerId: 'owner-1'` to TENANT fixtures in both test files**

**Step 3: Run tests to verify nothing breaks**

Run: `npx vitest run`
Expected: All 78 tests pass.

**Step 4: Commit**

```bash
git add src/domain/entities/tenant.ts src/application/use-cases/get-availability.test.ts src/application/use-cases/create-booking.test.ts
git commit -m "feat(domain): add ownerId to Tenant entity for auth linkage"
```

---

### Task 2: Extend repository ports for admin CRUD

**Files:**
- Modify: `src/application/ports/tenant-repository.ts`
- Modify: `src/application/ports/service-repository.ts`
- Modify: `src/application/ports/schedule-repository.ts`
- Modify: `src/application/use-cases/get-availability.test.ts` (mock repos)
- Modify: `src/application/use-cases/create-booking.test.ts` (mock repos)

**Step 1: Extend TenantRepository**

```typescript
// src/application/ports/tenant-repository.ts
import type { Tenant } from '@/domain/entities/tenant'

export interface TenantRepository {
  findBySlug(slug: string): Promise<Tenant | null>
  findById(id: string): Promise<Tenant | null>
  findByOwnerId(ownerId: string): Promise<Tenant | null>
  save(tenant: Tenant): Promise<Tenant>
}
```

**Step 2: Extend ServiceRepository**

```typescript
// src/application/ports/service-repository.ts
import type { Service } from '@/domain/entities/service'

export interface ServiceRepository {
  findByTenantId(tenantId: string): Promise<Service[]>
  findById(id: string): Promise<Service | null>
  save(service: Service): Promise<Service>
  update(service: Service): Promise<Service>
  delete(id: string): Promise<void>
}
```

**Step 3: Extend ScheduleRepository**

```typescript
// src/application/ports/schedule-repository.ts
import type { WeeklySchedule, DaySchedule } from '@/domain/entities/weekly-schedule'

export interface ScheduleRepository {
  findByTenantId(tenantId: string): Promise<WeeklySchedule | null>
  save(tenantId: string, schedules: DaySchedule[]): Promise<void>
}
```

**Step 4: Add stubs to mock repos in both test files**

Add `findByOwnerId: async () => TENANT`, `save: async (t) => t` to tenant mock.
Add `save: async (s) => s`, `update: async (s) => s`, `delete: async () => {}` to service mock.
Add `save: async () => {}` to schedule mock.

**Step 5: Run tests**

Run: `npx vitest run`
Expected: All 78 tests pass.

**Step 6: Commit**

```bash
git add src/application/ports/tenant-repository.ts src/application/ports/service-repository.ts src/application/ports/schedule-repository.ts src/application/use-cases/get-availability.test.ts src/application/use-cases/create-booking.test.ts
git commit -m "feat(application): extend repository ports with admin CRUD methods"
```

---

## Phase 1: Supabase Infrastructure

### Task 3: Install Supabase packages

**Step 1: Install**

```bash
cd booking-saas && npm install @supabase/supabase-js @supabase/ssr
```

**Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install @supabase/supabase-js and @supabase/ssr"
```

---

### Task 4: Create environment config and Supabase clients

**Files:**
- Create: `.env.local.example`
- Create: `src/infrastructure/supabase/server.ts`
- Create: `src/infrastructure/supabase/client.ts`

**Step 1: Create `.env.local` with placeholders + `.env.local.example`**

Create `.env.local` (gitignored, user fills in real values):

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Create `.env.local.example` (committed, same content as template):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

User replaces placeholder values in `.env.local` with their Supabase project credentials.

**Step 2: Create server client** (`src/infrastructure/supabase/server.ts`)

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createSupabaseServer() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from Server Component — session refresh handled by proxy.ts
          }
        },
      },
    }
  )
}
```

**Step 3: Create browser client** (`src/infrastructure/supabase/client.ts`)

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Step 4: Commit**

```bash
git add .env.local.example src/infrastructure/supabase/server.ts src/infrastructure/supabase/client.ts
git commit -m "feat(infra): add Supabase server and browser client utilities"
```

---

### Task 5: Create proxy.ts for session refresh + admin route protection

**Files:**
- Create: `src/proxy.ts`

Next.js 16 renamed `middleware.ts` to `proxy.ts`. The file goes in `src/` since we use a src directory.

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (
    !user &&
    request.nextUrl.pathname.startsWith('/admin') &&
    !request.nextUrl.pathname.startsWith('/admin/login') &&
    !request.nextUrl.pathname.startsWith('/admin/register')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Commit:**

```bash
git add src/proxy.ts
git commit -m "feat(infra): add proxy.ts for Supabase session refresh and admin protection"
```

---

### Task 6: Create SQL schema reference

**Files:**
- Create: `supabase/schema.sql`

This file is a reference — the user runs it manually in Supabase SQL editor.

```sql
-- Tenants (linked to auth.users)
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  slug text unique not null,
  currency text not null default 'EUR' check (currency in ('EUR', 'USD', 'GBP')),
  default_locale text not null default 'es-ES' check (default_locale in ('es-ES', 'en-US')),
  created_at timestamptz not null default now()
);
create unique index tenants_slug_idx on public.tenants(slug);
create unique index tenants_owner_idx on public.tenants(owner_id);

-- Services
create table public.services (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  name text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  price_cents integer not null default 0 check (price_cents >= 0),
  active boolean not null default true
);
create index services_tenant_idx on public.services(tenant_id);

-- Schedules (one row per day per tenant, time_ranges as JSONB [{start, end}])
create table public.schedules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  day_of_week integer not null check (day_of_week between 0 and 6),
  time_ranges jsonb not null default '[]',
  unique(tenant_id, day_of_week)
);
create index schedules_tenant_idx on public.schedules(tenant_id);

-- Customers
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  phone text
);

-- Bookings
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  service_id uuid references public.services(id) on delete cascade not null,
  customer_id uuid references public.customers(id) on delete cascade not null,
  date date not null,
  start_minutes integer not null check (start_minutes >= 0 and start_minutes < 1440),
  end_minutes integer not null check (end_minutes > 0 and end_minutes <= 1440),
  status text not null default 'PENDING' check (status in ('PENDING', 'CONFIRMED', 'CANCELLED')),
  created_at timestamptz not null default now(),
  check (start_minutes < end_minutes)
);
create index bookings_tenant_date_idx on public.bookings(tenant_id, date);

-- RLS
alter table public.tenants enable row level security;
alter table public.services enable row level security;
alter table public.schedules enable row level security;
alter table public.customers enable row level security;
alter table public.bookings enable row level security;

-- Tenants: owner full access, public read
create policy "Owner full access" on public.tenants for all using (auth.uid() = owner_id);
create policy "Public read" on public.tenants for select using (true);

-- Services: owner full access, public read active
create policy "Owner full access" on public.services for all using (tenant_id in (select id from public.tenants where owner_id = auth.uid()));
create policy "Public read active" on public.services for select using (active = true);

-- Schedules: owner full access, public read
create policy "Owner full access" on public.schedules for all using (tenant_id in (select id from public.tenants where owner_id = auth.uid()));
create policy "Public read" on public.schedules for select using (true);

-- Customers: anyone can insert + read
create policy "Public insert" on public.customers for insert with check (true);
create policy "Public read" on public.customers for select using (true);

-- Bookings: owner full access, public insert + read
create policy "Owner full access" on public.bookings for all using (tenant_id in (select id from public.tenants where owner_id = auth.uid()));
create policy "Public insert" on public.bookings for insert with check (true);
create policy "Public read" on public.bookings for select using (true);
```

**Note:** Before committing, the user should run this SQL in their Supabase dashboard SQL editor.

**Commit:**

```bash
git add supabase/schema.sql
git commit -m "chore: add reference SQL schema for Supabase"
```

---

### Task 7: Implement all Supabase repository adapters

**Files:**
- Create: `src/infrastructure/supabase/tenant-repository.ts`
- Create: `src/infrastructure/supabase/service-repository.ts`
- Create: `src/infrastructure/supabase/schedule-repository.ts`
- Create: `src/infrastructure/supabase/booking-repository.ts`
- Create: `src/infrastructure/supabase/customer-repository.ts`
- Create: `src/infrastructure/supabase/repositories.ts` (DI factory)

Each adapter takes a `SupabaseClient` in constructor, implements the corresponding port interface, and maps between DB rows (snake_case) and domain entities (camelCase).

**Key mappings:**
- `tenants` row -> `Tenant` entity (includes `owner_id` -> `ownerId`)
- `services` row -> `Service` entity (`price_cents` -> `Money(cents, currency)`, currency defaults to `'EUR'` for MVP)
- `schedules` rows -> `WeeklySchedule` entity (`time_ranges` JSONB `[{start, end}]` -> `TimeRange[]`)
- `bookings` row -> `Booking` entity (`start_minutes`/`end_minutes` -> `TimeRange`)
- `customers` row -> `Customer` entity

**DI factory** (`repositories.ts`):

```typescript
import type { SupabaseClient } from '@supabase/supabase-js'
import { SupabaseTenantRepository } from './tenant-repository'
import { SupabaseServiceRepository } from './service-repository'
import { SupabaseScheduleRepository } from './schedule-repository'
import { SupabaseBookingRepository } from './booking-repository'
import { SupabaseCustomerRepository } from './customer-repository'

export function createRepositories(supabase: SupabaseClient) {
  return {
    tenantRepo: new SupabaseTenantRepository(supabase),
    serviceRepo: new SupabaseServiceRepository(supabase),
    scheduleRepo: new SupabaseScheduleRepository(supabase),
    bookingRepo: new SupabaseBookingRepository(supabase),
    customerRepo: new SupabaseCustomerRepository(supabase),
  }
}
```

**Reuses:** `TimeRange` (`src/domain/value-objects/time-range.ts`), `Money` (`src/domain/value-objects/money.ts`), `WeeklySchedule` + `DaySchedule` (`src/domain/entities/weekly-schedule.ts`)

**Commit:**

```bash
git add src/infrastructure/supabase/tenant-repository.ts src/infrastructure/supabase/service-repository.ts src/infrastructure/supabase/schedule-repository.ts src/infrastructure/supabase/booking-repository.ts src/infrastructure/supabase/customer-repository.ts src/infrastructure/supabase/repositories.ts
git commit -m "feat(infra): implement all Supabase repository adapters and DI factory"
```

---

## Phase 2: Admin Panel — Auth

### Task 8: Create admin auth helper + login page

**Files:**
- Create: `src/infrastructure/supabase/admin-auth.ts` — `requireAdmin()` helper
- Create: `src/app/admin/layout.tsx` — minimal layout
- Create: `src/app/admin/login/page.tsx`
- Create: `src/app/admin/login/login-form.tsx` — client component with `useActionState`
- Create: `src/app/admin/login/actions.ts` — `login()` server action

**`requireAdmin()`** gets the authenticated user via `supabase.auth.getUser()`, finds their tenant via `findByOwnerId`, redirects to `/admin/login` if no user or `/admin/register` if no tenant. Returns `{ tenant, supabase }`.

**Login action** uses `supabase.auth.signInWithPassword()`, redirects to `/admin/dashboard` on success.

**Commit:**

```bash
git add src/infrastructure/supabase/admin-auth.ts src/app/admin/layout.tsx src/app/admin/login/
git commit -m "feat(admin): add login page with server action and requireAdmin helper"
```

---

### Task 9: Create register page

**Files:**
- Create: `src/app/admin/register/page.tsx`
- Create: `src/app/admin/register/register-form.tsx` — client component
- Create: `src/app/admin/register/actions.ts` — `register()` server action

**Register action:**
1. `supabase.auth.signUp({ email, password })`
2. Creates tenant via `SupabaseTenantRepository.save()` using `Slug.fromName(businessName)` (reuses existing `Slug` value object from `src/domain/value-objects/slug.ts`)
3. Redirects to `/admin/dashboard`

**Commit:**

```bash
git add src/app/admin/register/
git commit -m "feat(admin): add register page with tenant creation"
```

---

### Task 10: Create dashboard layout with sidebar

**Files:**
- Create: `src/app/admin/(dashboard)/layout.tsx` — calls `requireAdmin()`, renders sidebar + children
- Create: `src/app/admin/(dashboard)/sidebar.tsx` — navigation links (Dashboard, Services, Schedule, View public page)
- Create: `src/app/admin/(dashboard)/logout-button.tsx` — client component, `supabase.auth.signOut()`
- Create: `src/app/admin/(dashboard)/dashboard/page.tsx` — overview (active services count, today's bookings count, public page link)

**Route group `(dashboard)`** wraps all authenticated admin pages with sidebar. Login/register pages remain outside this group (no sidebar).

**Commit:**

```bash
git add src/app/admin/(dashboard)/
git commit -m "feat(admin): add dashboard layout with sidebar and overview page"
```

---

## Phase 3: Admin Panel — Services CRUD

### Task 11: Services list + create + edit + delete

**Files:**
- Create: `src/app/admin/(dashboard)/services/page.tsx` — list all services
- Create: `src/app/admin/(dashboard)/services/service-form.tsx` — shared create/edit form (client component)
- Create: `src/app/admin/(dashboard)/services/actions.ts` — `saveService()`, `deleteService()` server actions
- Create: `src/app/admin/(dashboard)/services/new/page.tsx`
- Create: `src/app/admin/(dashboard)/services/[id]/edit/page.tsx`
- Create: `src/app/admin/(dashboard)/services/[id]/edit/delete-button.tsx` — client component

**Server actions** use `SupabaseServiceRepository` (save/update/delete). Price input as EUR (e.g., "15.00") -> converted to cents via `Math.round(priceEur * 100)` -> `Money` value object.

**Note:** In Next.js 16, `params` in dynamic routes is a Promise: `const { id } = await params`.

**Commit:**

```bash
git add src/app/admin/(dashboard)/services/
git commit -m "feat(admin): add services CRUD pages"
```

---

## Phase 4: Admin Panel — Schedule Configuration

### Task 12: Schedule editor

**Files:**
- Create: `src/app/admin/(dashboard)/schedule/page.tsx` — loads current schedule, serializes to JSON for client
- Create: `src/app/admin/(dashboard)/schedule/schedule-editor.tsx` — client component with checkboxes per day + time inputs
- Create: `src/app/admin/(dashboard)/schedule/actions.ts` — `saveSchedule()` server action

**Schedule page** reads current schedule via `SupabaseScheduleRepository.findByTenantId()`, converts to plain JSON `[{dayOfWeek, dayName, open, ranges: [{start, end}]}]` for the client component.

**Schedule editor** renders 7 days (Monday-Sunday), each with a checkbox (open/closed) and time range inputs. Sends JSON payload to server action.

**Server action** parses JSON, converts HH:MM strings to `TimeRange.fromHHMM()` (reuses existing value object), calls `ScheduleRepository.save()` which deletes existing + inserts new rows.

**Commit:**

```bash
git add src/app/admin/(dashboard)/schedule/
git commit -m "feat(admin): add schedule editor with save action"
```

---

## Phase 5: Public Booking Page

### Task 13: Tenant landing page + booking widget

**Files:**
- Create: `src/app/[slug]/page.tsx` — server component, loads tenant + active services
- Create: `src/app/[slug]/booking-widget.tsx` — client component (service selection + date picker)
- Create: `src/app/[slug]/slot-picker.tsx` — client component (slot grid + customer form + confirmation)
- Create: `src/app/[slug]/actions.ts` — `getAvailability()` and `createBooking()` server actions

**Server actions bridge Clean Architecture:**
- `getAvailability()` -> instantiates `GetAvailabilityUseCase` with Supabase repos -> returns `SlotDTO[]`
- `createBooking()` -> instantiates `CreateBookingUseCase` with Supabase repos -> returns booking result

**Reuses:** `GetAvailabilityUseCase` (`src/application/use-cases/get-availability.ts`), `CreateBookingUseCase` (`src/application/use-cases/create-booking.ts`), `createRepositories` factory (`src/infrastructure/supabase/repositories.ts`)

**Booking flow (4 steps in the widget):**
1. Select a service (button cards)
2. Choose a date (date input, min=today)
3. Pick a time slot (grid of available 30-min slots, fetched via `getAvailability()` when date changes)
4. Enter name + email, confirm booking

**Commit:**

```bash
git add src/app/[slug]/
git commit -m "feat(public): add customer booking page with availability and booking flow"
```

---

## Phase 6: Final Wiring

### Task 14: Update root page + layout metadata

**Files:**
- Modify: `src/app/page.tsx` — replace default Next.js page with app landing (title + "Get Started" -> `/admin/register`)
- Modify: `src/app/layout.tsx` — update metadata title to "Reservas Chanantes"

**Commit:**

```bash
git add src/app/page.tsx src/app/layout.tsx
git commit -m "chore: update landing page and app metadata"
```

---

### Task 15: Run full test suite + manual smoke test

**Step 1: Run tests**

```bash
npx vitest run
```

Expected: All 78 tests pass (domain/application layers unchanged).

**Step 2: User fills in `.env.local`** with real Supabase credentials (URL + anon key).

**Step 3: User runs SQL schema** in Supabase SQL editor (`supabase/schema.sql`).

**Step 4: Manual smoke test**

```bash
npm run dev
```

1. Visit `/admin/register` -> create account with business name
2. Redirected to `/admin/dashboard` -> see overview cards
3. `/admin/services` -> create a service ("Corte de pelo", 30 min, 15 EUR)
4. `/admin/schedule` -> enable Monday-Friday 09:00-17:00, save
5. Open incognito tab -> visit `/{slug}` -> see services
6. Select service -> pick date (weekday) -> see 30-min slot grid
7. Select slot -> enter name + email -> confirm booking
8. Back in admin dashboard -> see booking count

---

## File Structure (new files)

```
src/
  proxy.ts                                    # Session refresh + admin route protection
  infrastructure/supabase/
    server.ts                                 # createSupabaseServer()
    client.ts                                 # createSupabaseBrowser()
    admin-auth.ts                             # requireAdmin()
    repositories.ts                           # DI factory
    tenant-repository.ts                      # SupabaseTenantRepository
    service-repository.ts                     # SupabaseServiceRepository
    schedule-repository.ts                    # SupabaseScheduleRepository
    booking-repository.ts                     # SupabaseBookingRepository
    customer-repository.ts                    # SupabaseCustomerRepository
  app/
    page.tsx                                  # Landing (modified)
    layout.tsx                                # Metadata (modified)
    admin/
      layout.tsx                              # Minimal admin layout
      login/{page, login-form, actions}.tsx    # Login
      register/{page, register-form, actions} # Register + tenant creation
      (dashboard)/
        layout.tsx                            # Sidebar layout (requires auth)
        sidebar.tsx                           # Nav links
        logout-button.tsx                     # Sign out
        dashboard/page.tsx                    # Overview
        services/
          page.tsx                            # List
          service-form.tsx                    # Shared form
          actions.ts                          # saveService, deleteService
          new/page.tsx                        # Create
          [id]/edit/{page, delete-button}     # Edit + delete
        schedule/
          page.tsx                            # Load schedule
          schedule-editor.tsx                 # Editor UI
          actions.ts                          # saveSchedule
    [slug]/
      page.tsx                                # Tenant landing
      booking-widget.tsx                      # Service + date selection
      slot-picker.tsx                         # Slot grid + booking form
      actions.ts                              # getAvailability, createBooking
supabase/
  schema.sql                                  # Reference SQL
.env.local.example                            # Env template
```
