# Anexos

Los anexos recogen el detalle estructural del sistema, complementando los capítulos 4 y 5. Toda la información se ha extraído directamente de las migraciones versionadas (`supabase/migrations/`) y del código fuente.

## Anexo A. Diccionario de datos

Esquema relacional completo tras aplicar las diez migraciones. Tipos y restricciones en notación PostgreSQL.

### Tabla `tenants`

| Columna | Tipo | Restricciones y notas |
|---------|------|-----------------------|
| `id` | `uuid` | PK, `default gen_random_uuid()` |
| `owner_id` | `uuid` | FK → `auth.users(id)` `ON DELETE CASCADE`, `NOT NULL` |
| `name` | `text` | `NOT NULL` |
| `slug` | `text` | `UNIQUE`, `NOT NULL` |
| `currency` | `text` | `NOT NULL`, `default 'EUR'`, `CHECK IN ('EUR','USD','GBP')` |
| `default_locale` | `text` | `NOT NULL`, `default 'es-ES'`, `CHECK IN ('es-ES','en-US')` |
| `created_at` | `timestamptz` | `NOT NULL`, `default now()` |
| `timezone` | `text` | `NOT NULL`, `default 'Europe/Madrid'` |
| `min_advance_minutes` | `integer` | `NOT NULL`, `default 120`, `CHECK >= 0` |
| `max_advance_days` | `integer` | `NOT NULL`, `default 30`, `CHECK >= 1` |
| `stripe_account_id` | `text` | Índice único parcial (`WHERE NOT NULL`) |
| `stripe_account_enabled` | `boolean` | `NOT NULL`, `default false` |
| `description` | `text` | Perfil de negocio |
| `category` | `text` | `NOT NULL`, `default 'LocalBusiness'` |
| `city` | `text` | Perfil de negocio |
| `address` | `text` | Perfil de negocio |
| `phone` | `text` | Teléfono de contacto del negocio |
| `seo_title` | `text` | Personalización SEO |
| `seo_description` | `text` | Personalización SEO |

### Tabla `services`

| Columna | Tipo | Restricciones y notas |
|---------|------|-----------------------|
| `id` | `uuid` | PK, `default gen_random_uuid()` |
| `tenant_id` | `uuid` | FK → `tenants(id)` `ON DELETE CASCADE`, `NOT NULL` |
| `name` | `text` | `NOT NULL` |
| `duration_minutes` | `integer` | `NOT NULL`, `CHECK > 0` |
| `price_cents` | `integer` | `NOT NULL`, `default 0`, `CHECK >= 0` |
| `active` | `boolean` | `NOT NULL`, `default true` |

### Tabla `schedules`

| Columna | Tipo | Restricciones y notas |
|---------|------|-----------------------|
| `id` | `uuid` | PK, `default gen_random_uuid()` |
| `tenant_id` | `uuid` | FK → `tenants(id)` `ON DELETE CASCADE`, `NOT NULL` |
| `day_of_week` | `integer` | `NOT NULL`, `CHECK BETWEEN 0 AND 6` (0 = domingo) |
| `time_ranges` | `jsonb` | `NOT NULL`, `default '[]'`; lista de `{start, end}` en minutos |
| — | — | `UNIQUE (tenant_id, day_of_week)` |

### Tabla `customers`

| Columna | Tipo | Restricciones y notas |
|---------|------|-----------------------|
| `id` | `uuid` | PK, `default gen_random_uuid()` |
| `name` | `text` | `NOT NULL` |
| `email` | `text` | `UNIQUE`, `NOT NULL` (identidad transversal del cliente) |
| `phone` | `text` | `NOT NULL`, `default ''` (originalmente *nullable*) |
| `auth_user_id` | `uuid` | FK → `auth.users(id)` `ON DELETE SET NULL`; índice único parcial |
| `preferred_locale` | `text` | `CHECK IN ('es-ES','en-US')` |

> El cliente **no** tiene `tenant_id`: se identifica por `email` y puede tener reservas en varios negocios. La vinculación con una cuenta autenticada se realiza mediante `auth_user_id` (portal del cliente).

### Tabla `bookings`

| Columna | Tipo | Restricciones y notas |
|---------|------|-----------------------|
| `id` | `uuid` | PK, `default gen_random_uuid()` |
| `tenant_id` | `uuid` | FK → `tenants(id)` `ON DELETE CASCADE`, `NOT NULL` |
| `service_id` | `uuid` | FK → `services(id)` `ON DELETE CASCADE`, `NOT NULL` |
| `customer_id` | `uuid` | FK → `customers(id)` `ON DELETE CASCADE`, `NOT NULL` |
| `date` | `date` | `NOT NULL` |
| `start_minutes` | `integer` | `NOT NULL`, `CHECK (>= 0 AND < 1440)` |
| `end_minutes` | `integer` | `NOT NULL`, `CHECK (> 0 AND <= 1440)` |
| `status` | `text` | `NOT NULL`, `default 'PENDING'`, `CHECK IN ('PENDING','CONFIRMED','CANCELLED')` |
| `created_at` | `timestamptz` | `NOT NULL`, `default now()` |
| `stripe_checkout_session_id` | `text` | Índice parcial (`WHERE NOT NULL`) |
| `reminder_sent_at` | `timestamptz` | Marca de recordatorio enviado; índice parcial |
| — | — | `CHECK (start_minutes < end_minutes)` |
| — | — | `EXCLUDE` `bookings_no_overlap` (véase Anexo A.1) |

#### A.1. Restricción de exclusión `bookings_no_overlap`

```sql
exclude using gist (
  tenant_id with =,
  date with =,
  int4range(start_minutes, end_minutes, '[)') with &&
) where (status <> 'CANCELLED');
```

Impide que dos reservas del mismo negocio y día ocupen rangos horarios solapados; las canceladas quedan excluidas para permitir re-reservar el hueco. Detalle en el [Capítulo 5 §5.3](05-implementacion.md).

#### A.2. Índices

| Índice | Tabla | Columnas | Tipo |
|--------|-------|----------|------|
| `tenants_slug_idx` | `tenants` | `(slug)` | Único |
| `tenants_owner_idx` | `tenants` | `(owner_id)` | Único |
| `tenants_stripe_account_idx` | `tenants` | `(stripe_account_id)` | Único parcial (`WHERE NOT NULL`) |
| `services_tenant_idx` | `services` | `(tenant_id)` | B-tree |
| `schedules_tenant_idx` | `schedules` | `(tenant_id)` | B-tree |
| `customers_auth_user_idx` | `customers` | `(auth_user_id)` | Único parcial (`WHERE NOT NULL`) |
| `bookings_tenant_date_idx` | `bookings` | `(tenant_id, date)` | B-tree |
| `bookings_customer_idx` | `bookings` | `(customer_id)` | B-tree |
| `bookings_stripe_session_idx` | `bookings` | `(stripe_checkout_session_id)` | Parcial (`WHERE NOT NULL`) |
| `bookings_reminder_pending_idx` | `bookings` | `(date, status)` | Parcial (`WHERE status='CONFIRMED' AND reminder_sent_at IS NULL`) |

## Anexo B. Políticas de seguridad a nivel de fila (RLS)

La seguridad a nivel de fila está **habilitada en las cinco tablas**. La siguiente tabla recoge todas las políticas vigentes (véase el análisis crítico en el [Capítulo 5 §5.7](05-implementacion.md)).

| Tabla | Política | Operación | Condición |
|-------|----------|-----------|-----------|
| `tenants` | Owner full access | `ALL` | `auth.uid() = owner_id` |
| `tenants` | Public read | `SELECT` | `true` |
| `services` | Owner full access | `ALL` | pertenencia al `tenant` del propietario |
| `services` | Public read active | `SELECT` | `active = true` |
| `schedules` | Owner full access | `ALL` | pertenencia al `tenant` del propietario |
| `schedules` | Public read | `SELECT` | `true` |
| `customers` | Public insert | `INSERT` | `true` ⚠️ |
| `customers` | Public read | `SELECT` | `true` ⚠️ |
| `customers` | Customer update own | `UPDATE` | `auth_user_id = auth.uid()` |
| `bookings` | Owner full access | `ALL` | pertenencia al `tenant` del propietario |
| `bookings` | Public insert | `INSERT` | `true` ⚠️ |
| `bookings` | Public read | `SELECT` | `true` ⚠️ |
| `bookings` | Customer update own bookings | `UPDATE` | propiedad vía `customer_id` ↔ `auth_user_id` |

> ⚠️ Las políticas marcadas son **deliberadamente permisivas** y constituyen la principal deuda de seguridad del sistema (habilitan el flujo de reserva anónimo a costa de un aislamiento *multi-tenant* incompleto). Su endurecimiento es la primera línea futura prioritaria ([Capítulo 7 §7.4.1](07-conclusiones.md)).

## Anexo C. Historial de migraciones

| # | Migración | Aportación |
|---|-----------|-----------|
| 1 | `20260220221052_initial_schema.sql` | Esquema inicial: 5 tablas, índices base y políticas RLS |
| 2 | `20260221_add_stripe_checkout.sql` | `stripe_checkout_session_id` en `bookings` + índice parcial |
| 3 | `20260223_add_booking_policy.sql` | Política de antelación en `tenants`: `timezone`, `min_advance_minutes`, `max_advance_days` |
| 4 | `20260224_require_customer_phone.sql` | `phone` obligatorio en `customers` (`default ''`, `NOT NULL`) |
| 5 | `20260225_add_reminder_sent_at.sql` | `reminder_sent_at` en `bookings` + índice de recordatorios pendientes |
| 6 | `20260227_add_customer_portal.sql` | `auth_user_id` y `preferred_locale` en `customers`; RLS de autoservicio; índices |
| 7 | `20260305_add_stripe_connect.sql` | `stripe_account_id` / `stripe_account_enabled` en `tenants` + índice único parcial |
| 8 | `20260306_add_tenant_profile.sql` | Perfil de negocio y SEO en `tenants` (7 columnas) |
| 9 | `20260422_prevent_booking_overlap.sql` | Extensión `btree_gist` + restricción de exclusión `bookings_no_overlap` |
| 10 | `20260629_add_onsite_payment.sql` | `allow_onsite_payment` en `tenants`; `payment_method` en `bookings` (`CHECK ONLINE`/`ON_SITE`) — habilita el pago presencial |

> Obsérvese que **ninguna migración añade una columna `plan`**: el modelo de planes (FREE/PRO) está diseñado en el dominio pero no persistido, por lo que todo negocio resuelve a `FREE` (véase [Capítulo 5 §5.5](05-implementacion.md)).

## Anexo D. Variables de entorno

Variables de configuración requeridas por el sistema (verificadas en el código fuente). Las prefijadas con `NEXT_PUBLIC_` se exponen al navegador; el resto son **secretos exclusivos del servidor**.

| Variable | Ámbito | Propósito |
|----------|--------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Público | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Público | Clave anónima de Supabase (sujeta a RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Secreto | Clave de servicio privilegiada (*webhooks*, *cron*) |
| `STRIPE_SECRET_KEY` | Secreto | Clave secreta de la API de Stripe (crea cuentas Express, enlaces de *onboarding* y sesiones de pago) |
| `STRIPE_WEBHOOK_SECRET` | Secreto | Firma del *webhook* de plataforma (`account.updated`) |
| `STRIPE_CONNECT_WEBHOOK_SECRET` | Secreto | Firma del *webhook* de Connect (`checkout.session.completed`) |
| `RESEND_API_KEY` | Secreto | Clave de API de Resend |
| `RESEND_FROM_DOMAIN` | Secreto | Dominio remitente verificado de los correos (`reservas@…`) |
| `SUPABASE_AUTH_HOOK_SECRET` | Secreto | Firma del *Send Email Hook* de Supabase Auth (correos de autenticación i18n) |
| `CRON_SECRET` | Secreto | Autorización de la tarea programada de recordatorios |
| `NEXT_PUBLIC_SITE_URL` | Público | URL pública del sitio (SEO, *sitemap*, *robots*) |
| `NEXT_PUBLIC_APP_URL` | Público | URL base usada en las plantillas de correo |

## Anexo E. Evaluación de seguridad (OWASP Top 10:2021)

Autoevaluación del sistema frente al estándar **OWASP Top 10:2021** [17], verificada contra el código fuente. Estado: ✅ cubierto · 🟡 parcial · 🔴 pendiente. Este anexo da soporte a las limitaciones de seguridad recogidas en el [Capítulo 7 §7.3](07-conclusiones.md) y a la línea futura de endurecimiento (§7.4.1).

| Categoría | Estado | Valoración (evidencia y brecha) |
|-----------|:------:|----------------------------------|
| **A01 · Broken Access Control** | 🟡 | ✅ Rutas privadas protegidas validando la sesión en servidor (`src/proxy.ts:28-51`, `auth.getUser()`); verificación de propiedad en cancelaciones (`admin/(dashboard)/bookings/actions.ts:15`; `application/use-cases/cancel-customer-booking.ts:37`). 🔴 Políticas **RLS permisivas** en `bookings`/`customers` (`supabase/migrations/20260220221052_initial_schema.sql:78-84`): el aislamiento entre *tenants* lo impone la aplicación, no la base de datos. 🟢 El *onboarding* de cuentas conectadas usa **Connect Express** (enlaces alojados por Stripe), por lo que no hay redireccionamiento OAuth con parámetro `state` que la plataforma deba validar. |
| **A02 · Cryptographic Failures** | ✅ | HTTPS gestionado por Vercel; *hashing* de contraseñas y emisión de JWT delegados a Supabase Auth; secretos fuera del código (variables de entorno); firmas de *webhook* verificadas. (La política de contraseñas se evalúa en A07.) |
| **A03 · Injection** | 🟡 | ✅ Acceso a datos parametrizado mediante el cliente de Supabase (`.eq`, `.insert`), sin concatenación de SQL. 🔴 **Inyección HTML en correos**: se interpolan datos del formulario público —`customer.name/email/phone`— sin escapar (`infrastructure/resend/email-templates.ts:42-44`; también `tenantName`/`service.name` en `:12,:30`). |
| **A04 · Insecure Design** | 🟡 | ✅ Diseño defensivo notable: invariantes de dominio y restricción `EXCLUDE`/`btree_gist` contra solapamientos (Cap. 5 §5.3). 🔴 Sin *rate limiting* en los puntos de entrada de la aplicación; sin modelo de amenazas formal. |
| **A05 · Security Misconfiguration** | 🟡 | 🔴 RLS mal configurada (véase A01). 🟡 No constan cabeceras de seguridad ni CSP (pendiente de verificación/adición en la configuración del *framework*). |
| **A06 · Vulnerable & Outdated Components** | 🟡 | ✅ Dependencias en versiones actuales (Next.js 16.1.6, React 19.2.3, etc.). 🔴 Sin análisis automatizado de dependencias (`npm audit` / Dependabot) integrado aún en la CI. |
| **A07 · Identification & Authentication Failures** | 🟡 | ✅ Autenticación por Supabase Auth y Google OAuth, **verificación de email obligatoria en el registro** (confirmación por enlace, `api/auth/confirm`), sesión validada en servidor, recuperación de contraseña funcional (`admin/reset-password`). 🟡 política de contraseñas débil (mínimo 6, sin requisitos de complejidad; `supabase/config.toml:175,178`); MFA deshabilitado. |
| **A08 · Software & Data Integrity Failures** | ✅ | ✅ Verificación de firma en **ambos** *webhooks* (`api/webhooks/stripe-connect/route.ts:23`; `api/webhooks/stripe/route.ts:21`) y guarda de idempotencia (`status === PENDING`). 🟡 Sin *idempotency keys* de Stripe en las llamadas salientes. |
| **A09 · Security Logging & Monitoring Failures** | 🔴 | Registro limitado a `console.error`; sin trazas estructuradas, alertas ni auditoría. |
| **A10 · Server-Side Request Forgery (SSRF)** | ✅ | Sin peticiones de servidor a URLs controladas por el usuario; las salidas se dirigen a proveedores fijos (Stripe, Supabase, Resend). Exposición baja. |

### E.1. Síntesis y prioridades

El sistema es **sólido** en A02, A08 y A10, y **parcial** —con brechas concretas y localizadas— en A01, A03, A04, A05, A06, A07 y A09. Las tres intervenciones de mayor retorno, ya recogidas como trabajo futuro en el [Capítulo 7 §7.4.1](07-conclusiones.md), son: (1) endurecer las políticas **RLS** (A01/A05); (2) **escapar el HTML** de los correos (A03); y (3) incorporar **logging estructurado** (A09). Su resolución elevaría la mayoría de categorías a ✅ y sustentaría un capítulo de modelado de amenazas.

## Anexo F. Estrategia de pruebas y política de cobertura

Complementa el [Capítulo 6](06-pruebas-calidad.md) detallando la **naturaleza de cada tipo de prueba** y la **política de cobertura diferenciada por capa** —el principio de que cada tipo de prueba justifica un objetivo de cobertura distinto—.

### F.1. Tipos de prueba y objetivo de cobertura

| Tipo | Naturaleza | Casos | ¿En cobertura? | Objetivo recomendado |
|------|-----------|:-----:|:--------------:|:--------------------:|
| **Unitarias de dominio** (objetos de valor y servicios puros) | Aisladas, deterministas, sin E/S | 123 (51 %) | Sí | ~100 % líneas / ~95 % ramas |
| **De casos de uso** (aplicación, con *test doubles* en memoria) | "Sociables": verifican la orquestación con dobles, no la implementación | 57 (24 %) | Sí | ~90 % líneas / ~85 % ramas |
| **De adaptador** (infraestructura, con *mocks* de los SDK) | Verifican el *mapeo* (p. ej. `23P01 → SlotTakenError`, cálculo de comisión), no la dependencia real | 60 (25 %) | Sí | ~85 % líneas / ~75 % ramas |
| **Integración real** (contra PostgreSQL efímero) | Ejercitaría la restricción `EXCLUDE` y las políticas RLS de extremo a extremo | 0 | — | flujos críticos (línea futura) |
| **E2E** (Playwright automatizado) | Recorrido completo del usuario contra el despliegue | 2 (automatizadas) | No (valida presentación) | flujo reservar → confirmar |

### F.2. Configuración actual

La cobertura se mide sobre las capas con lógica —dominio, aplicación e infraestructura— y define un **umbral** que actúa de puerta de calidad (`vitest.config.ts`):

```typescript
coverage: {
  provider: 'v8',
  include: ['src/domain/**', 'src/application/**', 'src/infrastructure/**'],
  exclude: [/* tipos e interfaces, clientes de SDK y glue de sesión */],
  thresholds: { statements: 85, functions: 85, lines: 85, branches: 75 },
}
```

Se **excluye** el *glue* sin lógica (clientes de SDK, `server.ts`, helpers de sesión) y la **capa de presentación** (`src/app`), cuya validación por líneas sería engañosa —esta se cubre con las **pruebas E2E de Playwright**—. La medición se ejecuta en **integración continua** (`.github/workflows/ci.yml`), que **falla el *build*** por debajo del umbral. La única categoría aún pendiente es la de **integración real** contra un PostgreSQL efímero.

### F.3. Política propuesta

El paso natural, coherente con el objetivo de calidad de la tesis, es declarar **umbrales diferenciados por capa** y ejecutarlos en CI:

```typescript
coverage: {
  provider: 'v8',
  include: ['src/domain/**', 'src/application/**'],
  thresholds: {
    'src/domain/**':      { lines: 100, branches: 95 },
    'src/application/**': { lines: 90,  branches: 85 },
  },
}
```

Complementado con una capa de **pruebas de integración** (la restricción `EXCLUDE` y la RLS contra un PostgreSQL real —p. ej. Supabase local o *Testcontainers*—) y **pruebas E2E** (Playwright del flujo de reserva), que cubren la infraestructura y la presentación que la cobertura unitaria, por diseño, no contempla.

---

[◀ Bibliografía](08-bibliografia.md) · [🏠 Índice](README.md)
