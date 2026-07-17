# Plan de corrección: Bloque B review fixes

**Fecha:** 2026-02-25
**Review de referencia:** `2026-02-25-bloque-b-review.md`
**Scope:** 4 issues (2 CRITICAL + 2 IMPORTANT)

---

## Fix 1: R1 — Dead code `canSharePage` en setup-checklist.tsx

**Problema:** El early return `if (allDone) return null` en línea 27-28 hace que `canSharePage` (misma condición) siempre sea `false`. El paso 3 nunca se renderiza como link activo.

**Solución:** Eliminar el early return. En su lugar, mover la comprobación `allDone` al componente padre (`dashboard/page.tsx`) para no renderizar `<SetupChecklist>` cuando todo esté completo. Dentro del checklist, `canSharePage` funcionará correctamente.

**Archivos:**
- `dashboard/page.tsx` — condicionar render de `<SetupChecklist>` a `!hasServices || !hasSchedule`
- `dashboard/setup-checklist.tsx` — eliminar early return `if (allDone) return null` y la variable `allDone`

---

## Fix 2: F1 — Timezone no en lista causa data loss

**Problema:** Si el timezone actual del tenant (e.g. `Asia/Kolkata`) no está en `COMMON_TIMEZONES`, el `<select>` con `defaultValue` no matchea ningún option y cae al primero (`Europe/Madrid`), causando sobreescritura silenciosa al guardar.

**Solución:** Si el timezone actual no está en la lista, incluirlo dinámicamente al inicio del array de opciones.

**Archivos:**
- `settings/settings-form.tsx` — computar la lista de timezones incluyendo el actual si no está presente

---

## Fix 3: C1 — Sin validación de NaN en campos numéricos

**Problema:** `Number("")` o `Number("abc")` devuelve `NaN`. `createBookingPolicy` no detecta NaN porque `NaN < 0` y `NaN > 43200` son ambos `false`. El policy se crea con `NaN` como valores, causando comportamiento impredecible downstream.

**Solución:** Añadir guards `isNaN` antes de llamar a `createBookingPolicy`, retornando error descriptivo.

**Archivos:**
- `settings/actions.ts` — añadir validación de `isNaN` para `minAdvanceMinutes` y `maxAdvanceDays`

---

## Fix 4: N1 — Fetch duplicado en layout + dashboard page

**Problema:** `layout.tsx` y `dashboard/page.tsx` ambos fetchean `services` y `schedule` independientemente. Son 2 round trips extra a Supabase en cada carga del dashboard.

**Solución:** En `dashboard/page.tsx`, eliminar el fetch de `schedule` (ya lo hace el layout) y solo mantener lo que necesita adicionalmente: los bookings del día. El checklist depende de `hasServices` (que sí necesita en page para las stats) y `hasSchedule`. Para `hasSchedule`, pasar la info desde el layout no es práctico (layout no puede pasar props a page en Next.js App Router).

**Alternativa elegida:** Usar `React.cache()` para deduplicar las llamadas a los repos. Crear funciones cacheadas que wrappeen las llamadas al repositorio, de forma que cuando layout y page llamen a la misma función en el mismo request, solo se ejecute una vez.

**Solución simplificada:** Dado que Next.js con App Router deduplica `fetch` nativo pero no llamadas a Supabase (que usa su propio cliente), la opción más simple y efectiva es eliminar el fetch de schedule en `dashboard/page.tsx` y en su lugar recibir `hasSchedule` como searchParam o simplemente re-fetchear aceptando el coste.

**Decisión final:** La opción más limpia es aceptar el doble fetch. Supabase queries son rápidas (<10ms), ambas están en `Promise.all`, y la alternativa (cache wrappers o context) añade complejidad para un ahorro marginal. **Marcar como won't fix** y documentar la decisión.

---

## Archivos afectados

| Archivo | Fix |
|---------|-----|
| `src/app/admin/(dashboard)/dashboard/page.tsx` | Fix 1 |
| `src/app/admin/(dashboard)/dashboard/setup-checklist.tsx` | Fix 1 |
| `src/app/admin/(dashboard)/settings/settings-form.tsx` | Fix 2 |
| `src/app/admin/(dashboard)/settings/actions.ts` | Fix 3 |

---

## Verificación

1. `npm run test` — todos los tests pasan
2. `npm run build` — 0 errores TypeScript
3. Manual: Con setup completo, el checklist desaparece y paso 3 link funciona cuando steps 1+2 están hechos
4. Manual: Tenant con timezone exótico → aparece en el select, no se pierde al guardar
5. Manual: Enviar form con campos numéricos vacíos → error descriptivo

---

## Issues descartados (won't fix en este pase)

| ID | Razón |
|----|-------|
| N1 | Doble fetch aceptable (<10ms Supabase, complejidad no justificada) |
| R2, R3, N2, F2, F3, C2, C3, C4 | Minor — se corregirán en pase de polish posterior |
