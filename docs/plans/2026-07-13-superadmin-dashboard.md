# Superadmin Dashboard — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Panel `/superadmin` para que el operador gestione a los negocios-cliente (ver datos + métricas, activar/desactivar).

**Architecture:** Route group server-rendered separado de `/admin`, guardado por `requireSuperadmin()` (allowlist de emails en env → `notFound()` si no). Datos cross-tenant con service-role tras el guard; agregación en un caso de uso (TS, paginada). Desactivar = flag `tenants.active` (inmutable para el dueño vía trigger) que bloquea el flujo público de reservas.

**Tech Stack:** Next.js 16 (App Router, Server Actions), Supabase (Postgres + service-role), TypeScript estricto, Vitest (+ Testing Library), Tailwind, i18n propio.

**Diseño de referencia:** `docs/plans/2026-07-13-superadmin-dashboard-design.md`

**Flujo de trabajo (main protegida):** trabajar en rama `feat/superadmin`; commit por tarea en la rama; al final **un PR** → esperar `quality` verde → merge. La **migración se aplica a mano en Supabase** (SQL Editor) tras desplegar el código (code-first: el código trata `active` ausente como `true`).

---

## Task 1: Entidad `Tenant.active` + mapeo (default true, code-first safe)

**Files:**
- Modify: `src/domain/entities/tenant.ts` (añadir `active: boolean`)
- Modify: `src/infrastructure/supabase/tenant-repository.ts:9-59` (TenantRow + toDomain)
- Test: `src/infrastructure/supabase/tenant-repository.test.ts` (si existe; si no, crear)

**Step 1 — Test:** un `toDomain` con `active: false` → `tenant.active === false`; sin la columna (`undefined`) → `tenant.active === true` (code-first seguro).

**Step 2 — Run fail.** `npm test -- tenant-repository`

**Step 3 — Implementar:**
- En `tenant.ts` añadir `active: boolean` a la interfaz `Tenant`.
- En `TenantRow` añadir `active?: boolean`.
- En `toDomain`: `active: row.active ?? true,`

**Step 4 — Run pass.**

**Step 5 — Commit:** `feat(domain): add tenant.active (defaults true when column absent)`

> Nota: `update()` (líneas 118-142) NO incluye `active` — dejarlo así (el dueño no lo cambia).

---

## Task 2: env `SUPERADMIN_EMAILS`

**Files:**
- Modify: `src/infrastructure/config/env-schema.ts:7-20`
- Test: `src/infrastructure/config/env-schema.test.ts`

**Step 1 — Test:** `parseEnv` acepta ausencia de `SUPERADMIN_EMAILS` (opcional) y la pasa cuando está.

**Step 3 — Implementar:** añadir `SUPERADMIN_EMAILS: z.string().optional(),` al `envSchema`.

**Step 5 — Commit:** `feat(config): add optional SUPERADMIN_EMAILS env`

---

## Task 3: Guard `requireSuperadmin` + helper puro `isSuperadmin`

**Files:**
- Create: `src/infrastructure/auth/superadmin.ts`
- Test: `src/infrastructure/auth/superadmin.test.ts`

**Step 1 — Test (helper puro, fail-closed):**

```ts
import { isSuperadmin } from './superadmin'

it('true si el email (normalizado) está en la allowlist', () => {
  expect(isSuperadmin('Op@x.com', 'a@x.com, op@x.com')).toBe(true)
})
it('false si no está', () => {
  expect(isSuperadmin('x@x.com', 'a@x.com')).toBe(false)
})
it('fail-closed: allowlist vacía/indefinida → false', () => {
  expect(isSuperadmin('a@x.com', undefined)).toBe(false)
  expect(isSuperadmin('a@x.com', '  ,  ')).toBe(false)
})
it('false si email es null/undefined', () => {
  expect(isSuperadmin(undefined, 'a@x.com')).toBe(false)
})
```

**Step 3 — Implementar:**

```ts
export function isSuperadmin(
  email: string | null | undefined,
  allowlist: string | undefined
): boolean {
  if (!email || !allowlist) return false
  const set = new Set(
    allowlist.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
  )
  return set.has(email.trim().toLowerCase())
}
```

Y el guard de servidor (no unit-testado; usa Supabase + `notFound`):

```ts
import { notFound } from 'next/navigation'
import { createSupabaseServer } from '@/infrastructure/supabase/server'
import { env } from '@/infrastructure/config/env'

export async function requireSuperadmin() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isSuperadmin(user?.email, env.SUPERADMIN_EMAILS)) notFound()
  return { user, supabase }
}
```

**Step 5 — Commit:** `feat(auth): add requireSuperadmin guard + isSuperadmin helper`

---

## Task 4: Repositorio de plataforma (service-role, paginado)

**Files:**
- Create: `src/infrastructure/supabase/platform-repository.ts`
- Test: `src/infrastructure/supabase/platform-repository.test.ts`

Devuelve datos crudos para agregar en el caso de uso. **Pagina** bookings con `.range()` en bucle (tope 1000 filas de PostgREST) — este es el punto que la revisión adversarial marcó como IMPORTANTE.

**Método:** `getPlatformData(): Promise<{ tenants: TenantStatsRow[]; bookings: BookingStatsRow[] }>`
- `tenants`: `select('id,name,slug,city,created_at,active,stripe_account_enabled,plan')`.
- `bookings`: bucle `.range(from, from+999)` sobre `select('tenant_id,status,payment_method,customer_id,service:services(price_cents)')` hasta recibir < 1000.

**Step 1 — Test:** con un `supabase` mock que devuelve 1000+1 filas en dos páginas, el método concatena las 1001 (verifica que **pagina** y no trunca).

**Step 5 — Commit:** `feat(infra): platform-repository with paginated cross-tenant read`

---

## Task 5: `GetPlatformOverviewUseCase` (agregación — la tarea central)

**Files:**
- Create: `src/application/use-cases/get-platform-overview.ts`
- Test: `src/application/use-cases/get-platform-overview.test.ts`

**Step 1 — Tests (con datos mock, sin BD):**
- Agrupa por `tenant_id`: cuenta reservas por estado (PENDING/CONFIRMED/CANCELLED).
- `customersCount` = nº de `customer_id` **distintos**.
- `volumeOnlineCents` / `volumeOnsiteCents` = Σ `price_cents` de CONFIRMED por `payment_method`.
- `commissionCents` = `round(volumeOnlineCents × getCommissionRateBps(plan) / 10000)` (FREE→5%). Presencial NO comisiona.
- Totales de plataforma = suma de por-tenant; `activeCount`.
- Un tenant sin reservas → todo a 0 (no desaparece de la lista).

**Step 3 — Implementar:** función pura que recibe `{tenants, bookings}` (del repo) y devuelve `{ perTenant: TenantOverview[], totals }`. Usa `getCommissionRateBps(tenant.plan)`.

**Step 5 — Commit:** `feat(app): GetPlatformOverviewUseCase (aggregation + per-plan commission)`

---

## Task 6: Filtro puro `filterTenantOverviews`

**Files:**
- Create: `src/application/use-cases/filter-tenant-overviews.ts`
- Test: idem `.test.ts`

**Step 1 — Test:** `estado` (all/active/inactive) y `q` (match case-insensitive en name/slug/city). Combinables.

**Step 3 — Implementar** función pura `(list, {estado, q}) => list`.

**Step 5 — Commit:** `feat(app): pure filter for superadmin table`

---

## Task 7: Migración `active` + trigger + toggle

**Files:**
- Create: `supabase/migrations/20260713_add_tenant_active.sql`
- Modify: `platform-repository.ts` (añadir `setTenantActive(id, active)` con service-role)
- Create: server action en `src/app/superadmin/actions.ts`

**Migración (SQL — aplicar a mano en Supabase tras desplegar código):**

```sql
alter table public.tenants add column active boolean not null default true;

create or replace function public.enforce_active_service_role_only()
returns trigger language plpgsql as $$
begin
  if new.active is distinct from old.active and auth.role() <> 'service_role' then
    raise exception 'Only the platform operator can change tenant.active';
  end if;
  return new;
end;
$$;

create trigger tenants_active_service_role_only
  before update on public.tenants
  for each row execute function public.enforce_active_service_role_only();
```

**Server action** `toggleTenantActive(tenantId, active)`: llama `requireSuperadmin()` PRIMERO; crea `createSupabaseAdmin()`; `setTenantActive`; `revalidatePath('/superadmin')`.

**Step 5 — Commit:** `feat(superadmin): active toggle action + migration (service-role trigger)`

---

## Task 8: Enforcement de la desactivación (bloquear reservas públicas)

**Files:**
- Modify: `src/app/[slug]/page.tsx` (canBook: añadir `tenant.active !== false`)
- Modify: `src/app/[slug]/actions.ts` (`getAvailability` y `createBooking`)
- Test: `src/app/[slug]/actions.test.ts` (o donde vivan) — `createBooking` rechaza si inactivo

**Step 1 — Test:** `createBooking` con un tenant `active:false` → `{ success:false }` (mensaje "no disponible"), sin crear reserva.

**Step 3 — Implementar:** en `createBooking`, tras `findBySlug`, si `tenant.active === false` → return error. En `getAvailability`, si inactivo → `{ slots: [] }`. En `page.tsx`, `canBook = tenant.active !== false && …`.

**Step 5 — Commit:** `feat(booking): block public bookings for deactivated tenants`

> El webhook `stripe-connect` NO se toca: honramos pagos en vuelo (decisión documentada).

---

## Task 9: Middleware — proteger `/superadmin`

**Files:** Modify `src/proxy.ts:32-41` (añadir la condición `/superadmin` al bloque que exige sesión y redirige a `/admin/login`).

**Step 5 — Commit:** `feat(superadmin): require session on /superadmin in middleware`

---

## Task 10: i18n — cadenas del superadmin (ES/EN)

**Files:** Modify `src/infrastructure/i18n/admin-translations.ts` (o crear `superadmin-translations.ts` siguiendo el mismo patrón), con claves para título, totales, columnas, filtros, badges, botones y confirmación, en `es-ES` y `en-US`.

**Step 5 — Commit:** `feat(i18n): superadmin strings ES/EN`

---

## Task 11: Página `/superadmin` + enlace condicional

**Files:**
- Create: `src/app/superadmin/page.tsx` (server component)
- Create: `src/app/superadmin/superadmin-table.tsx` (client, para el toggle con confirmación) o usar `<form>` con server action + `confirm()`
- Modify: layout/nav del admin (`src/app/admin/_components/…`) para el enlace condicional a `/superadmin` si `isSuperadmin`

**page.tsx (esqueleto):**
1. `await requireSuperadmin()`.
2. `detectLocaleFromHeaders()` → t.
3. `createSupabaseAdmin()` → `new SupabasePlatformRepository(admin).getPlatformData()`.
4. `GetPlatformOverviewUseCase` → overview; `filterTenantOverviews(overview.perTenant, searchParams)`.
5. Render: tarjetas de totales + barra de filtros (form GET) + tabla + toggle (server action, con confirmación).

**Step 5 — Commit:** `feat(superadmin): dashboard page (totals + table + filter + toggle)`

---

## Task 12: Verificación, PR, migración, docs

1. `npm run lint && npx tsc --noEmit && npm run test:coverage && npm run build` — todo verde (cobertura ≥ 90/80).
2. Push `feat/superadmin` → `gh pr create` → esperar `quality` verde → **merge** (deploy encadenado).
3. **Aplicar la migración** en Supabase (SQL Editor) — el SQL de Task 7.
4. **Añadir `SUPERADMIN_EMAILS`** en Vercel (Production + Preview) con tu email, y en `.env.local`.
5. **Verificar en prod (browser):** login superadmin → `/superadmin` carga con datos; desactivar un negocio de prueba → su página pública queda "no disponible"; reactivar → vuelve. Un no-superadmin en `/superadmin` → 404.
6. **Docs:** Anexo D (`SUPERADMIN_EMAILS`), README/DESPLIEGUE (§ superadmin), memoria §7 (el operador ya tiene panel) + regenerar PDF; commit por PR.

---

## Notas transversales
- **DRY/YAGNI/TDD**, commits frecuentes en la rama.
- Toda lógica de negocio en funciones puras / casos de uso → testeable (protege el gate 90/80).
- Nunca usar service-role antes de `requireSuperadmin()`.
- El `active` ausente = `true` (code-first): desplegar código antes de aplicar la migración es seguro.
