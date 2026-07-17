# Diseño: Dashboard de superadmin (operador de plataforma)

**Fecha:** 2026-07-13 · **Estado:** aprobado (validado adversarialmente) · **Enfoque:** mínimo pero funcional

> Panel interno para que el operador de la plataforma (Reservas Chanantes) gestione a
> sus **negocios-cliente** (tenants): ver datos y métricas, y activar/desactivar.

---

## 1. Objetivo y alcance

Añadir un panel `/superadmin` que permita al operador:

- **Ver** todos los negocios con sus datos (nombre, slug, ciudad, alta, Stripe conectado, estado).
- **Métricas por negocio:** nº de reservas (por estado), nº de clientes distintos, volumen confirmado (online/presencial) y comisión de plataforma.
- **Totales de plataforma** (foto de operador en un vistazo).
- **Activar/desactivar** un negocio (suspender = bloquear sus reservas públicas).
- **Filtrar** por estado (Activos/Inactivos/Todos) y **buscar** por nombre/slug/ciudad.

**Fuera de alcance (YAGNI consciente):** página de detalle por negocio, edición de datos ajenos, gestión de planes/facturación, exportaciones.

---

## 2. Arquitectura y autenticación

- **Ruta:** nuevo *route group* `src/app/superadmin/` (server components), **separado** de `/admin` para no mezclar el rol *dueño* con el rol *operador*. Una única página.
- **Identidad del superadmin:** variable de entorno **`SUPERADMIN_EMAILS`** (lista separada por comas). Sin rol en BD, sin login nuevo: el operador entra por `/admin/login` con su cuenta normal de Supabase.
- **Guard `requireSuperadmin()`** (server): obtiene `user`; si `user` es null o `user.email` (normalizado a minúsculas/trim) **no** está en la allowlist → `notFound()` (404, no filtra que la ruta existe). **Fail-closed:** si `SUPERADMIN_EMAILS` está indefinida o vacía, nadie es superadmin. Se ejecuta en la página **y** en la server action.
- **Middleware** (`src/proxy.ts`): añadir `/superadmin` a las rutas que exigen sesión (redirige a `/admin/login` si no hay sesión). La autorización fina la hace `requireSuperadmin`.
- **Acceso a datos cross-tenant:** `createSupabaseAdmin()` (service-role, salta RLS) **solo tras** pasar el guard. No se tocan políticas RLS (evita repetir el incidente de recursión).
- **Descubribilidad:** enlace condicional a `/superadmin` en el panel admin, visible solo si el email es superadmin.
- **Encaje Clean Architecture:** caso de uso `GetPlatformOverviewUseCase` (capa aplicación) hace la agregación; un repositorio (infraestructura, service-role) devuelve las filas. La lógica de negocio (agregar, comisión, split) vive en el caso de uso → testeable con mocks.

---

## 3. Modelo de datos y métricas

### 3.1 Migración

```sql
alter table public.tenants add column active boolean not null default true;

-- Solo el service-role (operador) puede cambiar `active`; un dueño suspendido
-- NO puede reactivarse por su cuenta (aunque tenga "Owner full access" en su fila).
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

> **Por qué un trigger y no `REVOKE UPDATE (active)`:** en Postgres los privilegios son
> aditivos y el `UPDATE` a nivel de **tabla** (que Supabase concede por defecto a
> `authenticated`) **anula** un `REVOKE` a nivel de **columna** → el REVOKE sería inefectivo
> y la suspensión, cosmética. El trigger es robusto y no rompe el guardado de Ajustes ni el
> callback de Stripe (ninguno modifica `active`). *(Hallazgo CRÍTICO de la revisión adversarial.)*

### 3.2 Métricas (agregación en TypeScript, paginada)

Lectura service-role: `tenants` + `bookings` con `service:services(price_cents)`. **Paginación
con `.range()` en bucle** para no truncar en el tope de 1000 filas de PostgREST *(hallazgo
IMPORTANTE de la revisión)*. Agregación por `tenant_id` en el caso de uso:

| Métrica | Definición |
|---|---|
| Datos | nombre, slug, ciudad, alta (`created_at`), `active`, Stripe conectado |
| Reservas | total + desglose por estado (PENDING/CONFIRMED/CANCELLED) |
| Clientes | nº de `customer_id` **distintos** con reserva en ese negocio (`customers` es global → "sus clientes" = los que han reservado con él) |
| Volumen confirmado | Σ `price_cents` de reservas CONFIRMED, split **online vs presencial** (`payment_method`) |
| Comisión plataforma | `getCommissionRateBps(tenant.plan)` × volumen **online** confirmado (hoy FREE = 5 %; excluye presencial, que no pasa por la plataforma) |

**Salvedad documentada:** las cifras son **estimación a precios y plan actuales** — las
reservas no guardan snapshot de precio; el volumen y la comisión históricos reales pueden
diferir si el negocio cambió de precios/plan.

### 3.3 Mapeo

Añadir `active` a `TenantRow`/`toDomain` en `tenant-repository.ts` y a la entidad `Tenant`,
con comparación **estricta** (`tenant.active === false`) en el enforcement, para evitar que un
`undefined` trate a todos como inactivos.

---

## 4. UI (`/superadmin`)

Página única server-rendered, sobria, **bilingüe ES/EN** (vía `detectLocaleFromHeaders()`).

- **Arriba:** tarjetas de **totales de plataforma** (negocios activos/totales · reservas · volumen · comisión).
- **Filtros** (formulario GET, query-params `?estado=&q=`, filtrado server-side por función pura testeable): estado (Activos/Inactivos/Todos) + búsqueda (nombre/slug/ciudad).
- **Tabla de negocios**, orden por volumen confirmado desc. Columnas: negocio (enlace a su página pública), ciudad, alta, reservas (total + confirmadas), clientes, volumen (online/presencial), comisión, Stripe, estado (badge), acción.
- **Acción = toggle** vía server action `toggleTenantActive(tenantId)` (guardada por `requireSuperadmin`, service-role, `revalidatePath('/superadmin')`), **con confirmación** para evitar clics accidentales en producción.

---

## 5. Seguridad y enforcement

- **Defensa en capas:** `requireSuperadmin()` en la página y en la server action; service-role solo tras el guard; trigger que hace `active` inmutable para el dueño; `SUPERADMIN_EMAILS` en env (local **y Vercel**), nunca en código.
- **Enforcement de la desactivación** (suspender = bloquear reservas públicas, el dueño sigue entrando a su panel):
  1. `[slug]/page.tsx` → si `tenant.active === false`, página "no disponible".
  2. `getAvailability` → sin huecos.
  3. `createBooking` (`CreateBookingUseCase` vía `findBySlug`) → rechaza. Cubre **toda** la creación anónima.
- **Pago en vuelo (decisión consciente):** el webhook `stripe-connect` **honra** los pagos ya iniciados (no comprueba `active`). La suspensión corta los checkouts *nuevos*; la ventana de un checkout iniciado justo antes de suspender es diminuta y el cliente ya pagó. Documentado como comportamiento aceptado.

---

## 6. Tests (mantener gate de cobertura 90/80)

- `GetPlatformOverviewUseCase`: agregación, comisión solo-online por plan, split online/presencial, clientes distintos (mocks).
- `requireSuperadmin`: email en/fuera de la allowlist, sesión nula, `SUPERADMIN_EMAILS` vacía (fail-closed), normalización.
- Filtro: función pura (estado + búsqueda).
- Enforcement: `createBooking` rechaza si `tenant.active === false`.
- (Opcional) E2E Playwright: login superadmin → tabla → desactivar → página pública no disponible.

---

## 7. Entregables de configuración y docs

- **Migración** `active` + trigger, a aplicar en Supabase (SQL Editor, proyecto `hzmzbjrkwcrxcqbrwshq`) y versionada en `supabase/migrations/`.
- **`SUPERADMIN_EMAILS`** en `.env.local` y en Vercel (Production + Preview). Documentar en README/DESPLIEGUE y **Anexo D** de la memoria.
- **Memoria §7:** mención breve de que el operador ya dispone de panel de gestión (deja de ser "operación solo vía Supabase").

---

## 8. Resumen de la validación adversarial

El diseño se sometió a una revisión adversarial contra el código real antes de implementar.
Cambios resultantes: (a) `REVOKE UPDATE (active)` → **trigger `BEFORE UPDATE`** [CRÍTICO];
(b) **paginación** de la lectura cross-tenant (tope 1000 filas de PostgREST) [IMPORTANTE];
(c) comisión **por plan** (`getCommissionRateBps`) en vez de 5 % fijo + salvedad de "precios
actuales" [IMPORTANTE]; (d) mapear `active` con comparación estricta y endurecer
`requireSuperadmin` (fail-closed) [MENOR]; (e) pago en vuelo honrado y documentado. Se
verificó que el patrón guard→service-role, `notFound()`, y el enforcement en `createBooking`
son correctos y sin bypass conocido.
