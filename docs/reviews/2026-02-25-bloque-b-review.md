# Review: Bloque B — Onboarding, setup indicators y settings

**Fecha:** 2026-02-25
**Commit:** `c9de5a2` feat: add onboarding checklist, setup indicators, and settings page
**Archivos revisados:** 11 (7 modificados, 4 nuevos)

---

## React Best Practices

### R1 — Dead code / unreachable branch (CRITICAL)
**Archivo:** `setup-checklist.tsx:27-30`
`canSharePage` se computa como `hasServices && hasSchedule`, pero línea 27 ya retorna `null` cuando `allDone` (misma condición). `canSharePage` es siempre `false` y el `<Link>` de línea 63 es inalcanzable. El paso 3 "Share your page" siempre se renderiza como texto deshabilitado.

### R2 — JSX en constante a nivel de módulo (MINOR)
**Archivo:** `sidebar.tsx:13-65`
El array `navItems` contiene elementos `<svg>` JSX definidos a nivel de módulo. Funciona en un componente `'use client'`, pero los elementos se recrean en cada evaluación del módulo. No es un problema de rendimiento a esta escala.

### R3 — `defaultValue` no se resetea tras save (MINOR)
**Archivo:** `settings-form.tsx:36`
Tras un save exitoso, los inputs retienen los valores antiguos del render inicial del servidor hasta que el usuario navega fuera y vuelve. El mensaje de éxito puede confundir si cambian valores de nuevo.

---

## Next.js Patterns

### N1 — Fetch duplicado de datos (IMPORTANT)
**Archivos:** `layout.tsx:11-24` + `dashboard/page.tsx:9-17`
Tanto el layout como la página del dashboard fetchean independientemente `services` y `schedule` via `Promise.all`. Son dos round trips separados a Supabase por los mismos datos en cada carga del dashboard.

### N2 — `revalidatePath('/admin')` es amplio (MINOR)
**Archivo:** `settings/actions.ts:37`
Revalida todo el árbol `/admin`. Funciona, pero fuerza re-render de bookings, services y schedule innecesariamente. Aceptable dado que el layout también necesita re-fetching para los badges del sidebar.

---

## Frontend Design

### F1 — Timezone dropdown sin fallback (CRITICAL)
**Archivo:** `settings-form.tsx:71-80`
Si el timezone actual del tenant no está en `COMMON_TIMEZONES`, el `<select>` con `defaultValue` silenciosamente cae al primer option (`Europe/Madrid`). Al guardar se sobreescribe el timezone real. **Riesgo de pérdida de datos.**

### F2 — Sin `aria-label` en iconos de pasos (MINOR)
**Archivo:** `setup-checklist.tsx`
Los SVGs de checkmark y los círculos numerados son puramente visuales. Los lectores de pantalla no transmiten el estado de completitud.

### F3 — Badge amber sin texto accesible (MINOR)
**Archivo:** `sidebar.tsx:98`
El `<span className="h-2 w-2 ...">` es invisible para lectores de pantalla.

---

## Code Quality & Security

### C1 — Sin validación server-side de rangos numéricos (IMPORTANT)
**Archivo:** `settings/actions.ts:15-18`
`Number(formData.get(...))` puede producir `NaN` si el campo está vacío o manipulado. `NaN` pasa las comparaciones de rango de `createBookingPolicy` (comparaciones con NaN devuelven false). El mensaje de error sería críptico.

### C2 — Variable `updated` sin usar (MINOR)
**Archivo:** `settings/actions.ts:31`
El retorno de `tenantRepo.update()` se asigna pero nunca se usa.

### C3 — `update` no enforce ownership explícitamente (MINOR)
**Archivo:** `infrastructure/supabase/tenant-repository.ts:94-109`
El filtro `.eq('id', tenant.id)` depende de RLS para prevenir actualizar otro tenant. Probablemente correcto pero no documentado.

### C4 — Sin tests para `saveSettings` action (MINOR)
La server action tiene lógica de validación y construcción de objetos de dominio que podrían testearse.

---

## Resumen de severidades

| ID | Severidad | Descripción |
|----|-----------|-------------|
| R1 | CRITICAL | `canSharePage` dead code — paso 3 nunca se activa como link |
| F1 | CRITICAL | Timezone no en lista causa data loss silencioso |
| C1 | IMPORTANT | `NaN` en campos numéricos no se valida |
| N1 | IMPORTANT | Fetch duplicado layout + dashboard |
| R3 | MINOR | `defaultValue` stale tras save |
| N2 | MINOR | `revalidatePath` amplio |
| F2 | MINOR | Sin aria-label en step icons |
| F3 | MINOR | Badge sin texto accesible |
| C2 | MINOR | Variable `updated` sin usar |
| C3 | MINOR | update no documenta dependencia de RLS |
| C4 | MINOR | Sin tests para saveSettings |
| R2 | MINOR | JSX en constante module-level |
