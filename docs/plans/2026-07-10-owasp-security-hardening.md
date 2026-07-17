# OWASP Security Hardening — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task.

**Goal:** Cerrar las 6 brechas de seguridad detectadas al auditar el proyecto contra el material OWASP del Máster (los 5 PDFs de `teoria/OWASP/`), para maximizar la nota de la evaluación de seguridad.

**Architecture:** Se mantiene la Clean Architecture existente. La lógica nueva y testeable (política de contraseñas, rate limiter, validación de entorno, logger de seguridad) vive en `domain/`, `application/` o `infrastructure/` — capas **dentro** del `include` de cobertura — y se implementa con TDD para no bajar del umbral CI (90 % stmts/funcs/líneas, 80 % ramas). Los cambios de la capa `app/` (server actions, `next.config.ts`) y SQL (RLS) quedan fuera de cobertura y se validan con E2E + verificación manual, porque no hay tests de integración contra BD real.

**Tech Stack:** Next.js 16 (App Router), TypeScript strict, Supabase (Postgres + RLS + Auth), Stripe Connect, Resend, Vitest, Playwright, **Zod** (nueva dependencia).

**Mapa brecha → tarea → OWASP:**

| Tarea | Brecha | Categoría teoría |
|---|---|---|
| 1 | Sin cabeceras de seguridad | A05 + Web Security Esencial |
| 2 | Contraseña mínima de 6 caracteres | A07 |
| 3 | Sin validación Zod de entorno (fail-first) | Variables de Entorno y Secretos |
| 4 | Sin rate limiting | A04 + A07 |
| 5 | Sin logging de eventos de seguridad / monitorización | A09 |
| 6 | RLS: lectura pública de PII en `customers`/`bookings` | A01 + A02 |
| 7 | Sincronizar documentación (README, memoria, memoria PDF) | — |

**Orden y riesgo:** se hacen primero las tareas 1–5 (riesgo bajo, un commit cada una) y la tarea 6 (RLS, riesgo alto) al final y aislada, para poder desplegar y verificar sin arrastrar el resto. Cada tarea es un commit independiente; **sin `Co-Authored-By`** (preferencia del usuario).

---

## Task 0: Preparación

**Files:** ninguno (solo git + baseline verde).

**Step 1: Crear rama de trabajo**

```bash
cd "F:/2026/Master/TFM/Op03-cl/booking-saas"
git checkout -b security/owasp-hardening
```

**Step 2: Confirmar baseline verde (mismo pipeline que la CI `quality`)**

```bash
npm run lint && npx tsc --noEmit && npm run test && npm run build
```
Expected: todo PASS. Si algo falla aquí, parar y arreglar antes de empezar (el fallo no es tuyo).

**Step 3: Añadir Zod (lo usan las tareas 2 y 3)**

```bash
npm install zod
```
Expected: `zod` aparece en `dependencies` de `package.json`.

---

## Task 1: Cabeceras de seguridad (A05)

Añade CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy y Permissions-Policy vía `next.config.ts` (equivalente a Helmet en Next.js). El material lista explícitamente "Security headers (Helmet)", CSP y HSTS en el checklist.

**Files:**
- Modify: `next.config.ts`
- Test: `e2e/security-headers.spec.ts` (nuevo)

**Step 1: Escribir el `next.config.ts` con cabeceras**

Reemplaza el contenido completo de `next.config.ts` por:

```ts
import type { NextConfig } from "next";

// Cabeceras de seguridad (A05 / Web Security Esencial). En Next.js el
// equivalente a Helmet es la clave `headers()`. La CSP arranca en modo
// permisivo para scripts ('unsafe-inline') porque Next inyecta scripts de
// hidratación sin nonce; endurecerla a nonce es una mejora futura anotada
// en la memoria.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self'",
  // Supabase (REST/Auth/Realtime) — el resto de integraciones (Stripe,
  // Resend) son server-to-server y no generan tráfico desde el navegador.
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
]

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

export default nextConfig;
```

**Step 2: Smoke test manual (OBLIGATORIO antes de commitear — la CSP puede romper el render)**

```bash
npm run build && npm run start
```
Con la app en `http://localhost:3000`, abrir en el navegador la **home**, una **página pública de negocio** (`/<slug>`), **`/admin/login`**, **`/admin/register`** y el **portal `/my/login`**. En cada una, abrir DevTools → Console y confirmar que **no hay errores de "Content Security Policy"** y que la página se ve/funciona igual. Si aparece alguna violación de CSP, añadir el origen concreto a la directiva correspondiente (o, como salida rápida, renombrar temporalmente la cabecera a `Content-Security-Policy-Report-Only` y anotarlo) antes de continuar.

**Step 3: Escribir un E2E que asegure las cabeceras (artefacto testeable)**

Crear `e2e/security-headers.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test('la home responde con las cabeceras de seguridad', async ({ request }) => {
  const res = await request.get('/')
  const h = res.headers()
  expect(h['strict-transport-security']).toContain('max-age=')
  expect(h['x-frame-options']).toBe('DENY')
  expect(h['x-content-type-options']).toBe('nosniff')
  expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin')
  expect(h['content-security-policy']).toContain("default-src 'self'")
})
```

**Step 4: Ejecutar el E2E**

```bash
npm run test:e2e -- security-headers
```
Expected: PASS. (Si el runner de Playwright no levanta el server automáticamente en tu entorno, ejecútalo contra el `npm run start` del Step 2.)

**Step 5: Commit**

```bash
git add next.config.ts e2e/security-headers.spec.ts
git commit -m "feat(security): add security headers (CSP, HSTS, X-Frame-Options) [A05]"
```

---

## Task 2: Política de contraseñas fuerte (A07)

El material A07 marca "123456 (6 caracteres)" como ❌ y exige **mínimo 12 caracteres, 1 mayúscula, 1 número y 1 carácter especial**. Hoy `register/actions.ts:47` acepta `length < 6`. Creamos un value object de dominio (mismo patrón que `EmailAddress`/`Slug`) para que la lógica quede **cubierta por tests unitarios** y reutilizable en registro y reseteo.

**Files:**
- Create: `src/domain/value-objects/password.ts`
- Create: `src/domain/value-objects/password.test.ts`
- Modify: `src/domain/errors/domain-errors.ts` (añadir `WeakPasswordError`)
- Modify: `src/app/admin/register/actions.ts:47-49`
- Modify: `src/app/admin/reset-password/actions.ts` (validar antes de `updateUser`)
- Modify (UI): `src/app/admin/register/register-form.tsx` y el formulario de reset (texto de ayuda + `minLength`)

**Step 1: Escribir el test que falla**

Crear `src/domain/value-objects/password.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { Password } from './password'
import { WeakPasswordError } from '@/domain/errors/domain-errors'

describe('Password', () => {
  const valid = 'Reserva2026!'

  it('acepta una contraseña que cumple la política', () => {
    expect(Password.create(valid).value).toBe(valid)
  })

  it('lista violaciones sin lanzar (para feedback en formulario)', () => {
    expect(Password.validate('short')).toContain('minLength')
    expect(Password.validate('alllowercase123!')).toContain('upper')
    expect(Password.validate('ALLUPPERCASE123!')).toContain('lower')
    expect(Password.validate('NoDigitsHere!!')).toContain('number')
    expect(Password.validate('NoSpecials12345')).toContain('special')
    expect(Password.validate(valid)).toEqual([])
  })

  it('lanza WeakPasswordError con contraseña débil', () => {
    expect(() => Password.create('123456')).toThrow(WeakPasswordError)
  })
})
```

**Step 2: Ejecutar y ver que falla**

```bash
npm run test -- password
```
Expected: FAIL (`Cannot find module './password'`).

**Step 3: Implementar el error de dominio**

En `src/domain/errors/domain-errors.ts`, añadir (junto a los demás):

```ts
export class WeakPasswordError extends DomainError {
  constructor() {
    super(
      'La contraseña debe tener al menos 12 caracteres e incluir mayúscula, minúscula, número y carácter especial.'
    )
  }
}
```

**Step 4: Implementar el value object**

Crear `src/domain/value-objects/password.ts`:

```ts
import { WeakPasswordError } from '@/domain/errors/domain-errors'

/** Política de contraseñas A07: 12+, mayúscula, minúscula, número y especial. */
export class Password {
  private constructor(public readonly value: string) {}

  /** Devuelve la lista de reglas incumplidas (vacía si es válida). */
  static validate(raw: string): string[] {
    const violations: string[] = []
    if (raw.length < 12) violations.push('minLength')
    if (!/[A-Z]/.test(raw)) violations.push('upper')
    if (!/[a-z]/.test(raw)) violations.push('lower')
    if (!/[0-9]/.test(raw)) violations.push('number')
    if (!/[^A-Za-z0-9]/.test(raw)) violations.push('special')
    return violations
  }

  static create(raw: string): Password {
    if (Password.validate(raw).length > 0) throw new WeakPasswordError()
    return new Password(raw)
  }
}
```

**Step 5: Ejecutar y ver que pasa**

```bash
npm run test -- password
```
Expected: PASS.

**Step 6: Cablear en el registro**

En `src/app/admin/register/actions.ts`, importar arriba:

```ts
import { Password } from '@/domain/value-objects/password'
import { WeakPasswordError } from '@/domain/errors/domain-errors'
```

y reemplazar el bloque de validación (líneas ~47-49):

```ts
    if (typeof password !== 'string' || password.length < 6) {
      return { error: 'Password must be at least 6 characters.' }
    }
```

por:

```ts
    if (typeof password !== 'string') {
      return { error: 'Password is required.' }
    }
    try {
      Password.create(password)
    } catch (e) {
      if (e instanceof WeakPasswordError) return { error: e.message }
      throw e
    }
```

**Step 7: Cablear en el reseteo de contraseña**

En `src/app/admin/reset-password/actions.ts`, tras la comprobación `password !== confirm` (línea ~29) y antes de `createSupabaseServer()`, añadir:

```ts
  if (Password.validate(password).length > 0) {
    return { error: t.passwordWeak ?? t.passwordMismatch }
  }
```

e importar `import { Password } from '@/domain/value-objects/password'` arriba. (Si `t.passwordWeak` no existe en las traducciones, usa el fallback mostrado o añade la clave en `admin-translations`.)

**Step 8: Actualizar la UI de los formularios**

En `src/app/admin/register/register-form.tsx` (y el formulario de reset), actualizar el `minLength` del input de contraseña a `12` y el texto de ayuda para reflejar la nueva política (12+, mayúscula, minúscula, número, especial). Es UX/defensa en profundidad: el backend ya valida.

**Step 9: Verificar tipos + lint + tests**

```bash
npx tsc --noEmit && npm run lint && npm run test -- password
```
Expected: PASS.

**Step 10: Commit**

```bash
git add src/domain/value-objects/password.ts src/domain/value-objects/password.test.ts src/domain/errors/domain-errors.ts src/app/admin/register src/app/admin/reset-password
git commit -m "feat(security): enforce strong password policy (12+, complexity) [A07]"
```

---

## Task 3: Validación de entorno con Zod, fail-first (Variables de Entorno y Secretos)

El PDF dedicado exige validar el entorno con Zod y filosofía "fail-first". Hoy se usa `process.env.X!` en ~10 sitios. Creamos un esquema Zod que valida los **secretos de servidor** y falla en el arranque con mensaje claro. Para mantener testeable la lógica (capa `infrastructure` está en cobertura), separamos `parseEnv` (función pura, testeada) del módulo que la invoca sobre `process.env`.

**Files:**
- Create: `src/infrastructure/config/env-schema.ts` (esquema + `parseEnv`, testeable)
- Create: `src/infrastructure/config/env-schema.test.ts`
- Create: `src/infrastructure/config/env.ts` (invoca `parseEnv(process.env)`, server-only)
- Modify: lecturas de secretos server-side → usar `env` (ver Step 6)

**Step 1: Test que falla**

Crear `src/infrastructure/config/env-schema.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { parseEnv } from './env-schema'

const base = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://x.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
  SUPABASE_SERVICE_ROLE_KEY: 'service',
}

describe('parseEnv', () => {
  it('valida un entorno correcto', () => {
    expect(parseEnv(base).NEXT_PUBLIC_SUPABASE_URL).toBe('https://x.supabase.co')
  })

  it('falla si falta un secreto obligatorio', () => {
    const { SUPABASE_SERVICE_ROLE_KEY, ...missing } = base
    expect(() => parseEnv(missing)).toThrow()
  })

  it('falla si la URL de Supabase no es una URL', () => {
    expect(() => parseEnv({ ...base, NEXT_PUBLIC_SUPABASE_URL: 'no-url' })).toThrow()
  })
})
```

**Step 2: Ejecutar y ver que falla**

```bash
npm run test -- env-schema
```
Expected: FAIL (módulo inexistente).

**Step 3: Implementar el esquema**

Crear `src/infrastructure/config/env-schema.ts`:

```ts
import { z } from 'zod'

// Secretos y config de servidor. Los opcionales corresponden a integraciones
// que pueden no estar activas en un entorno dado (p. ej. Stripe/Resend en local).
const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  STRIPE_CONNECT_WEBHOOK_SECRET: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_DOMAIN: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(1).optional(),
  SUPABASE_AUTH_HOOK_SECRET: z.string().min(1).optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
})

export type Env = z.infer<typeof envSchema>

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source)
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n')
    // Fail-first: no arrancamos sin config válida. Nunca imprimimos el valor.
    throw new Error(`Variables de entorno inválidas:\n${issues}`)
  }
  return result.data
}
```

**Step 4: Ejecutar y ver que pasa**

```bash
npm run test -- env-schema
```
Expected: PASS.

**Step 5: Módulo runtime server-only**

Crear `src/infrastructure/config/env.ts`:

```ts
import 'server-only'
import { parseEnv } from './env-schema'

// Se evalúa al importar: si el entorno es inválido, la app falla de inmediato
// con un mensaje claro (filosofía fail-first del material).
export const env = parseEnv(process.env)
```

> ⚠️ **No importar `env.ts` desde componentes cliente** (contiene secretos de servidor). El `import 'server-only'` lo garantiza en build.

**Step 6: Migrar lecturas de secretos server-side**

Sustituir `process.env.X!` por `env.X` **solo en ficheros de servidor**, importando `import { env } from '@/infrastructure/config/env'`:

- `src/infrastructure/stripe/client.ts` → `env.STRIPE_SECRET_KEY`
- `src/infrastructure/resend/client.ts` → `env.RESEND_API_KEY`
- `src/infrastructure/supabase/admin-client.ts` → `env.NEXT_PUBLIC_SUPABASE_URL`, `env.SUPABASE_SERVICE_ROLE_KEY`
- `src/app/api/webhooks/stripe/route.ts` → `env.STRIPE_WEBHOOK_SECRET`
- `src/app/api/webhooks/stripe-connect/route.ts` → `env.STRIPE_CONNECT_WEBHOOK_SECRET`
- `src/app/api/cron/send-reminders/route.ts` → `env.CRON_SECRET`
- `src/app/api/auth/send-email/route.ts` → `env.SUPABASE_AUTH_HOOK_SECRET`, `env.RESEND_FROM_DOMAIN`

> **No migrar** `proxy.ts` ni `src/infrastructure/supabase/server.ts`/`client.ts`: el middleware y el cliente de navegador no deben importar el módulo server-only. Sus `NEXT_PUBLIC_*` los inyecta Next en build y son públicos por diseño.

**Step 7: Verificar arranque + tipos + build**

```bash
npx tsc --noEmit && npm run lint && npm run test && npm run build
```
Expected: PASS (con `.env.local` completo). Prueba negativa opcional: renombra temporalmente `SUPABASE_SERVICE_ROLE_KEY` en `.env.local`, corre `npm run build` y confirma que falla con el mensaje claro; luego restáuralo.

**Step 8: Commit**

```bash
git add src/infrastructure/config src/infrastructure/stripe/client.ts src/infrastructure/resend/client.ts src/infrastructure/supabase/admin-client.ts src/app/api
git commit -m "feat(security): validate env vars with Zod, fail-first [env/secrets]"
```

---

## Task 4: Rate limiting en endpoints sensibles (A04 + A07)

El material dedica un ejercicio entero al rate limiting (login, reseteo, endpoints). Implementamos un limitador de ventana deslizante **puro y testeable** y lo cableamos en las server actions sensibles, con la IP como clave.

> **Nota de honestidad técnica (anotar en la memoria):** en Vercel serverless el estado en memoria es efímero/por-instancia, así que este limitador es defensa en profundidad a nivel de app; Supabase Auth ya aplica rate-limit real en login/signup. Para durabilidad en producción se anotaría Upstash/Vercel KV como línea futura.

**Files:**
- Create: `src/infrastructure/security/rate-limiter.ts`
- Create: `src/infrastructure/security/rate-limiter.test.ts`
- Modify: `src/app/admin/login/actions.ts`, `src/app/admin/register/actions.ts`, `src/app/admin/reset-password/actions.ts`, `src/app/[slug]/actions.ts` (booking)

**Step 1: Test que falla**

Crear `src/infrastructure/security/rate-limiter.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { RateLimiter } from './rate-limiter'

describe('RateLimiter', () => {
  it('permite hasta max peticiones y bloquea la siguiente', () => {
    const rl = new RateLimiter({ windowMs: 1000, max: 3 })
    let t = 0
    const now = () => t
    expect(rl.check('ip', now)).toBe(true)
    expect(rl.check('ip', now)).toBe(true)
    expect(rl.check('ip', now)).toBe(true)
    expect(rl.check('ip', now)).toBe(false) // 4ª dentro de la ventana
  })

  it('vuelve a permitir cuando la ventana expira', () => {
    const rl = new RateLimiter({ windowMs: 1000, max: 1 })
    let t = 0
    const now = () => t
    expect(rl.check('ip', now)).toBe(true)
    expect(rl.check('ip', now)).toBe(false)
    t = 1001
    expect(rl.check('ip', now)).toBe(true)
  })

  it('aísla claves distintas', () => {
    const rl = new RateLimiter({ windowMs: 1000, max: 1 })
    const now = () => 0
    expect(rl.check('a', now)).toBe(true)
    expect(rl.check('b', now)).toBe(true)
  })
})
```

**Step 2: Ejecutar y ver que falla**

```bash
npm run test -- rate-limiter
```
Expected: FAIL.

**Step 3: Implementar el limitador**

Crear `src/infrastructure/security/rate-limiter.ts`:

```ts
interface Options {
  windowMs: number
  max: number
}

/**
 * Ventana deslizante en memoria. `now` es inyectable para tests deterministas
 * (evita Date.now()). En serverless el estado es por-instancia: defensa en
 * profundidad a nivel de app, no la única barrera.
 */
export class RateLimiter {
  private readonly hits = new Map<string, number[]>()

  constructor(private readonly opts: Options) {}

  check(key: string, now: () => number = () => Date.now()): boolean {
    const t = now()
    const cutoff = t - this.opts.windowMs
    const recent = (this.hits.get(key) ?? []).filter((ts) => ts > cutoff)
    if (recent.length >= this.opts.max) {
      this.hits.set(key, recent)
      return false
    }
    recent.push(t)
    this.hits.set(key, recent)
    return true
  }
}

// Instancias compartidas por tipo de endpoint (límites más estrictos en auth).
export const authLimiter = new RateLimiter({ windowMs: 60_000, max: 5 })
export const bookingLimiter = new RateLimiter({ windowMs: 60_000, max: 10 })
```

**Step 4: Ejecutar y ver que pasa**

```bash
npm run test -- rate-limiter
```
Expected: PASS.

**Step 5: Helper de IP + cableado en las actions de auth**

En cada action sensible, antes de la lógica, obtener la IP de las cabeceras y comprobar el limitador. Patrón (para `login`, `register`, `resetPassword`, `updatePassword`):

```ts
import { headers } from 'next/headers'
import { authLimiter } from '@/infrastructure/security/rate-limiter'

// dentro de la action, al principio:
const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
if (!authLimiter.check(`login:${ip}`)) {
  return { error: 'Demasiados intentos. Inténtalo de nuevo en un minuto.' }
}
```

Ajustar la clave por action (`register:`, `reset:`, etc.) y el tipo de retorno al que ya usa cada action. En `createBooking` (`src/app/[slug]/actions.ts`) usar `bookingLimiter` con clave `booking:${ip}` devolviendo `{ success: false, error: '...' }`.

**Step 6: Verificar**

```bash
npx tsc --noEmit && npm run lint && npm run test -- rate-limiter
```
Expected: PASS.

**Step 7: Commit**

```bash
git add src/infrastructure/security src/app/admin/login src/app/admin/register src/app/admin/reset-password "src/app/[slug]/actions.ts"
git commit -m "feat(security): add rate limiting on auth and booking actions [A04/A07]"
```

---

## Task 5: Logging de eventos de seguridad (A09)

El material A09 pide registrar eventos de seguridad (login OK/KO, cambios de permisos) **sin exponer secretos**, con datos para respuesta a incidentes (quién/cuándo/qué). Creamos un logger estructurado testeable y lo cableamos en los puntos clave.

**Files:**
- Create: `src/infrastructure/observability/security-logger.ts`
- Create: `src/infrastructure/observability/security-logger.test.ts`
- Modify: `src/app/admin/login/actions.ts` (login OK/KO), `src/app/admin/(dashboard)/bookings/actions.ts` (cancelación), y los puntos de rechazo por rate-limit de la Task 4.

**Step 1: Test que falla**

Crear `src/infrastructure/observability/security-logger.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest'
import { logSecurityEvent } from './security-logger'

describe('logSecurityEvent', () => {
  it('emite JSON estructurado con tipo y metadatos', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
    logSecurityEvent({ type: 'login_success', ip: '1.2.3.4', email: 'a@b.com' })
    const line = spy.mock.calls[0][0] as string
    const parsed = JSON.parse(line)
    expect(parsed.type).toBe('login_success')
    expect(parsed.channel).toBe('security')
    spy.mockRestore()
  })

  it('nunca serializa campos sensibles (password/token)', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
    // @ts-expect-error probamos que campos extra no listados no se filtran
    logSecurityEvent({ type: 'login_failure', ip: '1.2.3.4', password: 'secret' })
    expect(spy.mock.calls[0][0]).not.toContain('secret')
    spy.mockRestore()
  })
})
```

**Step 2: Ejecutar y ver que falla**

```bash
npm run test -- security-logger
```
Expected: FAIL.

**Step 3: Implementar el logger**

Crear `src/infrastructure/observability/security-logger.ts`:

```ts
type SecurityEventType =
  | 'login_success'
  | 'login_failure'
  | 'rate_limited'
  | 'booking_cancelled'
  | 'password_reset_requested'

interface SecurityEvent {
  type: SecurityEventType
  ip?: string
  email?: string
  userId?: string
  path?: string
}

/**
 * Registro estructurado de eventos de seguridad (A09). Whitelist explícita de
 * campos: nunca se serializan passwords, tokens ni PII fuera de email/IP.
 * En Vercel, console.* llega a los logs de la plataforma; añadir un DSN de
 * Sentry es la mejora de monitorización anotada como línea futura.
 */
export function logSecurityEvent(event: SecurityEvent): void {
  const safe = {
    channel: 'security',
    type: event.type,
    ...(event.ip && { ip: event.ip }),
    ...(event.email && { email: event.email }),
    ...(event.userId && { userId: event.userId }),
    ...(event.path && { path: event.path }),
  }
  console.info(JSON.stringify(safe))
}
```

**Step 4: Ejecutar y ver que pasa**

```bash
npm run test -- security-logger
```
Expected: PASS.

**Step 5: Cablear en login (éxito y fallo)**

En `src/app/admin/login/actions.ts`, importar `logSecurityEvent` y registrar: en la rama de error `login_failure` (con `ip`, `email`), y tras un login correcto (antes del `redirect`) `login_success`. En el rechazo por rate-limit añadido en la Task 4, emitir `rate_limited`. En `cancelBooking` registrar `booking_cancelled` (con `userId` del tenant). **Nunca** pasar la contraseña ni el token.

**Step 6: Verificar**

```bash
npx tsc --noEmit && npm run lint && npm run test -- security-logger
```
Expected: PASS.

**Step 7: Commit**

```bash
git add src/infrastructure/observability src/app/admin/login src/app/admin/\(dashboard\)/bookings/actions.ts
git commit -m "feat(security): structured security-event logging [A09]"
```

---

## Task 6: Endurecer RLS — cerrar la fuga de PII (A01 + A02) ⚠️ ALTO RIESGO

**Problema:** `customers` y `bookings` tienen `Public read using(true)`. Como `NEXT_PUBLIC_SUPABASE_ANON_KEY` es pública, cualquiera puede volcar todos los clientes (nombre/email/teléfono) y reservas vía la API REST de Supabase.

**Estrategia (elegida por el usuario — "cerrarla del todo"):** mover al **service-role** las 3 lecturas que hoy dependen del acceso público (disponibilidad anónima, creación de reserva anónima, y el auto-enlace de cliente en el portal), y luego bloquear las políticas a **owner + self**. Las server actions afectadas son código de servidor de confianza que solo emite queries parametrizadas concretas, así que usar service-role ahí es correcto.

> **Verificación en BD real antes de tocar producción:** hay acceso a Supabase vía SQL Editor / MCP (proyecto `hzmzbjrkwcrxcqbrwshq`). Los pasos incluyen comprobar que el flujo público sigue funcionando tras la migración.

**Files:**
- Modify: `src/app/[slug]/actions.ts` (`getAvailability` y `createBooking` → repos con service-role)
- Modify: `src/infrastructure/supabase/customer-auth.ts` (`requireCustomer` → enlazar/crear con service-role)
- Create: `supabase/migrations/20260710_tighten_rls_pii.sql`

**Step 1: Enrutar las lecturas anónimas de confianza al service-role**

En `src/app/[slug]/actions.ts`:
- importar `import { createSupabaseAdmin } from '@/infrastructure/supabase/admin-client'`
- en `getAvailability`, cambiar `const supabase = await createSupabaseServer()` por `const supabase = createSupabaseAdmin()`
- en `createBooking`, igual: construir `createRepositories(createSupabaseAdmin())`

Motivo: disponibilidad y creación de reserva son públicas por diseño (cualquiera puede reservar); la autorización es inherente (búsqueda por slug + restricción de solapamiento en BD), no depende del `auth.uid()` del visitante.

**Step 2: Enrutar el auto-enlace de cliente al service-role**

En `src/infrastructure/supabase/customer-auth.ts` (`requireCustomer`): el paso que busca por email un registro **no enlazado** (`auth_user_id NULL`) y lo enlaza/crea no puede funcionar con RLS self. Usar un repo con service-role solo para esos pasos, manteniendo el cliente de sesión (`supabase`) como valor devuelto para las lecturas posteriores (que sí van scoped por RLS self):

```ts
import { createSupabaseAdmin } from './admin-client'
// ...
export async function requireCustomer() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/my/login')

  const sessionRepo = new SupabaseCustomerRepository(supabase)
  const adminRepo = new SupabaseCustomerRepository(createSupabaseAdmin())

  let customer = await sessionRepo.findByAuthUserId(user.id) // self policy
  if (customer) return { customer, supabase }

  const existing = await adminRepo.findByEmail(user.email!)   // bypassa RLS
  if (existing) {
    customer = await adminRepo.update({ ...existing, authUserId: user.id })
    return { customer, supabase }
  }

  customer = await adminRepo.save({
    id: crypto.randomUUID(),
    name: user.user_metadata?.full_name ?? user.email!.split('@')[0],
    email: user.email!,
    phone: '',
    authUserId: user.id,
  })
  redirect('/my/profile?setup=true')
}
```

**Step 3: Escribir la migración RLS**

Crear `supabase/migrations/20260710_tighten_rls_pii.sql`:

```sql
-- Cierra la fuga de PII (A01/A02): customers y bookings ya no son de lectura
-- pública. Los flujos anónimos legítimos (disponibilidad, creación de reserva,
-- auto-enlace de cliente) pasan a usar el service-role en la capa de servidor.

-- customers ----------------------------------------------------------------
drop policy if exists "Public read" on public.customers;
drop policy if exists "Public insert" on public.customers;

-- El cliente lee su propio registro (portal).
create policy "Customer read own" on public.customers for select
  using (auth_user_id = auth.uid());

-- El dueño del negocio lee los clientes que tienen reserva con él (panel admin).
create policy "Owner reads booking customers" on public.customers for select
  using (
    id in (
      select customer_id from public.bookings
      where tenant_id in (
        select id from public.tenants where owner_id = auth.uid()
      )
    )
  );
-- (Se mantiene "Customer update own" de la migración del portal.)

-- bookings -----------------------------------------------------------------
drop policy if exists "Public read" on public.bookings;
drop policy if exists "Public insert" on public.bookings;

-- El cliente lee sus propias reservas (portal).
create policy "Customer read own bookings" on public.bookings for select
  using (
    customer_id in (
      select id from public.customers where auth_user_id = auth.uid()
    )
  );
-- (Se mantienen "Owner full access" y "Customer update own bookings".)
```

**Step 4: Verificar el flujo en BD real (SQL Editor / MCP) ANTES de desplegar**

Aplicar la migración en el proyecto Supabase y comprobar:

1. **La fuga está cerrada** — con la anon key (o rol `anon` en el SQL Editor):
   ```sql
   set role anon;
   select count(*) from public.customers;  -- esperado: 0 filas / permission
   select count(*) from public.bookings;   -- esperado: 0 filas / permission
   reset role;
   ```
2. **El panel admin sigue viendo sus datos** — como usuario dueño (probar en la app: `/admin/bookings` muestra cliente + servicio).
3. **El portal sigue funcionando** — login de cliente, `/my` lista sus reservas y puede cancelar.
4. **El flujo público sigue funcionando** — en `/<slug>`: la disponibilidad carga y se puede crear una reserva (online y on-site). Este es el paso crítico: si algo falla, revisar que las actions usan `createSupabaseAdmin()` (Step 1).

**Step 5: E2E de regresión del flujo público**

```bash
npm run test:e2e
```
Expected: PASS (los E2E existentes cubren reserva/disponibilidad; si fallan, la migración o el enrutado rompió el flujo).

**Step 6: Verificar tipos/lint/build**

```bash
npx tsc --noEmit && npm run lint && npm run build
```
Expected: PASS.

**Step 7: Commit**

```bash
git add "src/app/[slug]/actions.ts" src/infrastructure/supabase/customer-auth.ts supabase/migrations/20260710_tighten_rls_pii.sql
git commit -m "feat(security): tighten RLS to close PII exposure on customers/bookings [A01/A02]"
```

---

## Task 7: Sincronizar documentación

Mantener la coherencia doc que exige el proyecto (memoria + README + memoria PDF).

**Files:**
- Modify: `README.md` (párrafo de limitaciones, ~línea 220: la RLS permisiva ya **no** es limitación; describir el paquete de hardening OWASP)
- Modify: `docs/memoria/07-conclusiones.md` (retirar la RLS de "limitaciones conocidas")
- Create/Modify (memoria): **sección de Seguridad dedicada** que documente todo el paquete OWASP (ver Step 1) — capítulo o sección propia dentro de `docs/memoria/`
- Regenerar el PDF de la memoria (generador en scratchpad `memoria-pdf/gen-pdf.cjs`, ver memoria de proyecto)

**Step 1: Añadir una sección de Seguridad a la documentación** (petición explícita del usuario)

Crear una sección/capítulo de **Seguridad** en la memoria (y un bloque equivalente en el README) que recoja TODO el paquete implementado, estructurado por el material del Máster:
- **Matriz de cumplimiento OWASP Top 10** (A01–A05, A07, A09) — brecha → defensa aplicada → fichero/commit.
- **AuthN/AuthZ:** JWT de Supabase en cookies HttpOnly, `requireAdmin`/`requireCustomer`, 401 vs 403, verificación de firma de webhooks (Stripe + Standard Webhooks).
- **Web Security:** XSS (React auto-escape + JSON-LD escapado), CSP y cabeceras (Task 1), HTTPS/HSTS.
- **Variables de entorno y secretos:** validación Zod fail-first (Task 3), `.env.local.example`, `.gitignore`, service-role solo en servidor.
- **Defensa en profundidad:** RLS owner+self (Task 6), rate limiting (Task 4), logging de eventos de seguridad (Task 5), política de contraseñas (Task 2).
- **Trade-offs y líneas futuras** (del bloque "Notas de decisiones" de este plan): CSP con nonce, rate-limit durable (Upstash), Sentry.

**Step 2:** Actualizar README y `07-conclusiones.md` reflejando el nuevo estado (RLS cerrada, cabeceras, contraseñas 12+, Zod env, rate limiting, logging) y enlazar a la nueva sección de Seguridad.

**Step 3:** Regenerar el PDF de la memoria.

**Step 4: Commit**

```bash
git add README.md docs/memoria
git commit -m "docs: add Security section documenting the OWASP hardening"
```

---

## Cierre: puerta de calidad completa

Antes de abrir PR / desplegar, correr el pipeline `quality` completo igual que la CI:

```bash
npm run lint && npx tsc --noEmit && npm run test:coverage && npm run build
```
Expected: todo PASS y cobertura ≥ 90/80 (los módulos nuevos testeados — password, rate-limiter, env-schema, security-logger — sostienen el umbral).

**Actualizar memoria de proyecto** (`.claude/.../memory/`): anotar que las brechas OWASP se cerraron y en qué commits, y actualizar la nota de "RLS permisiva" que hoy figura como pendiente.

---

## Notas de decisiones (para la defensa del TFM)

- **RLS + service-role:** se pierde RLS como defensa en profundidad en 3 rutas de servidor de confianza; a cambio se cierra la fuga real de PII por la anon key. Trade-off consciente y documentado.
- **CSP con `'unsafe-inline'` en `script-src`:** Next inyecta scripts de hidratación sin nonce; la CSP estricta basada en nonce queda como línea futura.
- **Rate limiting en memoria:** efímero en serverless; defensa en profundidad a nivel de app sobre el rate-limit real de Supabase Auth. Upstash/Vercel KV como mejora productiva.
- **Zod:** se adopta para entorno (donde el material lo pide explícitamente) y, vía value objects de dominio ya existentes, para la validación de entrada — manteniendo el dominio puro.
