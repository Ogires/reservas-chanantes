# Anexos

Los anexos recogen el detalle estructural del sistema, complementando los capítulos 4 y 5. Toda la información se ha extraído directamente de las migraciones versionadas (`supabase/migrations/`) y del código fuente.

## Anexo A. Diccionario de datos

Esquema relacional completo tras aplicar las once migraciones. Tipos y restricciones en notación PostgreSQL.

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
| `customers` | Customer read own | `SELECT` | `auth_user_id = auth.uid()` |
| `customers` | Owner reads booking customers | `SELECT` | el cliente tiene una reserva en un `tenant` del propietario |
| `customers` | Customer update own | `UPDATE` | `auth_user_id = auth.uid()` |
| `bookings` | Owner full access | `ALL` | pertenencia al `tenant` del propietario |
| `bookings` | Customer read own bookings | `SELECT` | propiedad vía `customer_id` ↔ `auth_user_id` |
| `bookings` | Customer update own bookings | `UPDATE` | propiedad vía `customer_id` ↔ `auth_user_id` |

> Desde la migración `20260710_tighten_rls_pii.sql` (Anexo C, #11), las tablas `customers` y `bookings` **ya no admiten lectura ni inserción públicas**: el acceso queda acotado al **propietario** del negocio y al **titular** de los datos. Los flujos anónimos legítimos —cálculo de disponibilidad, creación de reserva y auto-enlace del cliente en el portal— se resuelven en la capa de servidor con el cliente de *service-role*, que emite únicamente consultas parametrizadas y de confianza. Con ello se cierra la fuga de información personal que exponía la clave anónima; el análisis completo figura en el [Anexo E](#anexo-e-evaluación-de-seguridad-owasp-top-102021) y en el [Capítulo 5 §5.7](05-implementacion.md).

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
| 11 | `20260710_tighten_rls_pii.sql` | Endurece la RLS de `customers` y `bookings`: retira la lectura/inserción públicas que exponían la PII y acota el acceso a propietario y titular; los flujos anónimos de confianza se reenrutan al cliente de *service-role* (OWASP A01/A02) |

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

Adicionalmente, el **pipeline de despliegue encadenado** (GitHub Actions → Vercel, §6.7) requiere tres *secrets* de repositorio en GitHub, empleados **solo en tiempo de CI** y nunca por la aplicación:

| Secret (GitHub Actions) | Ámbito | Propósito |
|-------------------------|--------|-----------|
| `VERCEL_TOKEN` | CI/CD (secreto) | Token de despliegue de Vercel para publicar desde la CI |
| `VERCEL_ORG_ID` | CI/CD | Identificador de la organización/equipo de Vercel |
| `VERCEL_PROJECT_ID` | CI/CD | Identificador del proyecto de Vercel |

## Anexo E. Evaluación de seguridad (OWASP Top 10:2021)

Este anexo constituye la **sección de seguridad** de la memoria. Documenta el paquete de endurecimiento aplicado sobre la rama `security/owasp-hardening` y autoevalúa el sistema frente al estándar **OWASP Top 10:2021** [17], verificando cada defensa contra el código fuente y las migraciones versionadas. Estado: ✅ cubierto · 🟡 parcial (con brecha localizada) · 🔴 pendiente. Da soporte al grado de cumplimiento del objetivo OE-4 y a las líneas de seguridad recogidas en el [Capítulo 7](07-conclusiones.md).

El endurecimiento se materializó en **seis intervenciones independientes**, cada una trazable a un *commit* y a una categoría del material de seguridad del Máster:

| # | Commit | Intervención | Categoría |
|---|--------|--------------|-----------|
| 1 | `35db607` | Cabeceras de seguridad (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) vía `next.config.ts`, con un E2E de verificación | A05 |
| 2 | `5b5b119` | Política de contraseñas fuerte —objeto de valor `Password`: 12+ caracteres con mayúscula, minúscula, número y carácter especial— en registro y reseteo | A07 |
| 3 | `b00c979` | Validación de variables de entorno con Zod, *fail-first* perezoso (`env-schema.ts` + `env.ts`) | Variables de entorno y secretos |
| 4 | `853470a` | Limitación de tasa (*rate limiting*) de ventana deslizante por IP en autenticación (5/min) y reserva (10/min) | A04 + A07 |
| 5 | `7f27c9d` | Registro estructurado de eventos de seguridad (`logSecurityEvent`) con lista blanca de campos | A09 |
| 6 | `51187be` | Endurecimiento de la RLS de `customers`/`bookings` para cerrar la exposición de PII por la clave anónima | A01 + A02 |

### E.1. Matriz de cumplimiento OWASP Top 10:2021

| Categoría | Estado | Riesgo principal | Defensa aplicada | Evidencia (fichero · commit) |
|-----------|:------:|------------------|------------------|------------------------------|
| **A01 · Broken Access Control** | ✅ | Acceso a datos de otros negocios o clientes | RLS acotada a **propietario + titular** en las cinco tablas; autorización de servidor (`requireAdmin`/`requireCustomer`) y verificación de propiedad en cancelaciones; validación de sesión en el *middleware*; flujos anónimos de confianza reenrutados al *service-role* | `supabase/migrations/20260710_tighten_rls_pii.sql` · `51187be`; `infrastructure/supabase/admin-auth.ts`, `customer-auth.ts`; `src/proxy.ts` |
| **A02 · Cryptographic Failures** | ✅ | Exposición de credenciales o datos personales | *Hashing* de contraseñas y emisión de JWT delegados a Supabase Auth; HTTPS (Vercel) reforzado con **HSTS** (`max-age=63072000; includeSubDomains; preload`); los datos de tarjeta nunca tocan el servidor (Stripe Checkout); cierre de la fuga de PII por la *anon key* | `next.config.ts` · `35db607`; `20260710_tighten_rls_pii.sql` · `51187be` |
| **A03 · Injection** | 🟡 | Inyección SQL / XSS | Acceso a datos **parametrizado** mediante el constructor de consultas de Supabase (`.eq`, `.insert`), sin concatenación de SQL; auto-escapado de React; JSON-LD serializado y escapado (`<`). Brecha residual: interpolación HTML sin escapar en las plantillas de correo | `src/app/[slug]/page.tsx:108`; `infrastructure/resend/email-templates.ts` |
| **A04 · Insecure Design** | 🟡 | Ausencia de controles de diseño (abuso, fuerza bruta) | Invariantes de dominio y restricción `EXCLUDE`/`btree_gist` contra solapamientos; mensajes de error genéricos y **anti-enumeración** en el restablecimiento; **limitación de tasa** por IP en login/registro/reset/reserva. Resta un modelo de amenazas formal | `infrastructure/security/rate-limiter.ts` · `853470a`; Cap. 5 §5.3 |
| **A05 · Security Misconfiguration** | ✅ | Configuración insegura por defecto | **Cabeceras de seguridad y CSP** en todas las rutas (X-Frame-Options `DENY`, `frame-ancestors 'none'`, nosniff, Referrer-Policy, Permissions-Policy); RLS correctamente configurada (véase A01). Matiz: la CSP emplea `'unsafe-inline'` en `script-src` | `next.config.ts` · `35db607`; `e2e/security-headers.spec.ts` |
| **A06 · Vulnerable & Outdated Components** | 🟡 | Dependencias con vulnerabilidades conocidas | Dependencias en versiones actuales (Next.js 16.1.6, React 19.2.3). Resta el análisis automatizado (`npm audit` / Dependabot) integrado en la CI | `package.json` |
| **A07 · Identification & Authentication Failures** | 🟡 | Contraseñas débiles y ataques de fuerza bruta | **Política de contraseñas fuerte** (12+, complejidad, `WeakPasswordError`) en registro y reseteo; verificación de email obligatoria; sesión validada en servidor; **limitación de tasa** en autenticación. Resta habilitar MFA | `src/domain/value-objects/password.ts` · `5b5b119`; `rate-limiter.ts` · `853470a` |
| **A08 · Software & Data Integrity Failures** | ✅ | Manipulación de eventos o datos | Verificación de firma en **ambos** *webhooks* (Stripe `constructEvent` + HMAC *Standard Webhooks*) y guarda de idempotencia (`status === PENDING`). Matiz menor: sin *idempotency keys* en las llamadas salientes a Stripe | `api/webhooks/stripe-connect/route.ts`; `api/webhooks/stripe/route.ts` |
| **A09 · Security Logging & Monitoring Failures** | 🟡 | Falta de trazabilidad ante incidentes | **Registro estructurado** de eventos (`logSecurityEvent`) con **lista blanca** de campos (nunca contraseñas ni *tokens*) en login OK/KO, rate-limit, cancelación de reserva y solicitud de reseteo. Resta alertado y APM (p. ej. Sentry) | `src/infrastructure/observability/security-logger.ts` · `7f27c9d` |
| **A10 · Server-Side Request Forgery (SSRF)** | ✅ | Peticiones de servidor a destinos controlados por el usuario | Sin peticiones de servidor a URLs controladas por el usuario; las salidas se dirigen a proveedores fijos (Stripe, Supabase, Resend). Exposición baja | — |

### E.2. Autenticación y autorización basadas en JWT

La identidad se gestiona con **Supabase Auth**, que emite un **JWT** almacenado en *cookies* `HttpOnly` —nunca en `localStorage`—, lo que lo sustrae al alcance de un XSS. Cada petición de servidor revalida la sesión con `auth.getUser()` (no se confía en la *cookie* sin verificar) y la autorización se centraliza en dos guardas: `requireAdmin` (panel del negocio) y `requireCustomer` (portal del cliente). La distinción entre **autenticación** y **autorización** se refleja en la respuesta: la ausencia de sesión provoca un **redireccionamiento 401** al *login* correspondiente, mientras que un acceso a un recurso ajeno se rechaza como **403** o, en la capa de datos, mediante la RLS de propietario/titular. Finalmente, las notificaciones entrantes se autentican por **firma**: los *webhooks* de Stripe con `constructEvent` y el *Send Email Hook* de Supabase con HMAC (*Standard Webhooks*), de modo que un tercero no puede falsificar un evento de confirmación de pago o de envío de correo.

### E.3. Seguridad web (XSS, CSP y transporte)

El riesgo de **XSS** se mitiga en origen por el **auto-escapado de React**, que trata todo texto interpolado como datos, no como marcado; el único punto que inyecta HTML crudo —el bloque **JSON-LD** de datos estructurados de la página pública— serializa el objeto y escapa el carácter `<` como `<` (`src/app/[slug]/page.tsx:108`), impidiendo la ruptura del contexto `<script>`. Sobre esa base, el paquete de endurecimiento añade una **política de seguridad de contenido (CSP)** y el resto de **cabeceras de seguridad** en todas las rutas (`next.config.ts`): `default-src 'self'`, `frame-ancestors 'none'` y `X-Frame-Options: DENY` (anti-*clickjacking*), `X-Content-Type-Options: nosniff`, `Referrer-Policy` y `Permissions-Policy` restrictiva. El **transporte** se fuerza a HTTPS con **HSTS** (`max-age` de dos años, `includeSubDomains; preload`). Un E2E de Playwright (`e2e/security-headers.spec.ts`) verifica la presencia de estas cabeceras como artefacto de regresión.

### E.4. Variables de entorno y gestión de secretos

Siguiendo la filosofía *fail-first* del material, la configuración se valida con un **esquema Zod** (`src/infrastructure/config/env-schema.ts`) que la función pura `parseEnv` —cubierta por pruebas unitarias— aplica sobre `process.env` en `env.ts`. La validación es **perezosa**: se ejecuta en el primer acceso, no al importar el módulo, de modo que no acopla el `next build` ni la CI a la presencia de los secretos, pero **falla de inmediato y con un mensaje claro** —sin imprimir jamás el valor del secreto— antes de que una configuración inválida cause daño. El módulo declara `import 'server-only'`, garantizando que los secretos **no puedan filtrarse a un componente de cliente**; la separación entre variables públicas (`NEXT_PUBLIC_*`, inyectadas en *build*) y secretos de servidor se detalla en el [Anexo D](#anexo-d-variables-de-entorno). El repositorio versiona una plantilla `.env.local.example` y el `.gitignore` cubre `.env*`, de modo que ningún secreto llega al control de versiones; la clave de *service-role* es exclusiva del servidor.

### E.5. Defensa en profundidad

Las garantías se disponen en **capas redundantes**, de forma que el compromiso de una no expone el sistema: en la **base de datos**, la RLS de propietario/titular y la restricción `EXCLUDE` de integridad; en la **aplicación**, la autorización de servidor, la política de contraseñas y la limitación de tasa; en el **transporte y el navegador**, HSTS y la CSP; y en la **observabilidad**, el registro estructurado de eventos de seguridad. El reenrutado de tres rutas anónimas de confianza al *service-role* (disponibilidad, creación de reserva y auto-enlace del cliente) renuncia deliberadamente a la RLS **solo** en código de servidor que emite consultas parametrizadas concretas; aun ahí, la aplicación filtra por `tenant_id` y la restricción de solapamiento sigue vigente en la base de datos, conservando así más de un nivel de protección.

### E.6. Compromisos y líneas futuras

El endurecimiento se documenta con honestidad, incluidos sus **compromisos conscientes**. La CSP emplea `'unsafe-inline'` en `script-src` porque Next.js inyecta *scripts* de hidratación sin *nonce*; una **CSP estricta basada en *nonce*** queda como trabajo futuro. La limitación de tasa es **en memoria y por instancia**, adecuada como defensa en profundidad a nivel de aplicación sobre el *rate limiting* real de Supabase Auth, pero efímera en un entorno *serverless*; su **durabilidad** requeriría un almacén compartido (Upstash / Vercel KV). La monitorización es **basada en trazas**; su evolución natural es un **DSN de Sentry** con alertado. Restan, además, brechas menores y localizadas: el **escapado del HTML** en las plantillas de correo (A03), el **análisis automatizado de dependencias** (A06), la habilitación de **MFA** (A07) y las **claves de idempotencia** salientes de Stripe (A08). En conjunto, el sistema pasa a ser **sólido** en A01, A02, A05, A08 y A10, y **parcial con brechas acotadas** en A03, A04, A06, A07 y A09; su resolución sustentaría un futuro **capítulo de modelado de amenazas**.

## Anexo F. Estrategia de pruebas y política de cobertura

Complementa el [Capítulo 6](06-pruebas-calidad.md) detallando la **naturaleza de cada tipo de prueba** y la **política de cobertura diferenciada por capa** —el principio de que cada tipo de prueba justifica un objetivo de cobertura distinto—.

### F.1. Tipos de prueba y objetivo de cobertura

| Tipo | Naturaleza | Casos | ¿En cobertura? | Objetivo recomendado |
|------|-----------|:-----:|:--------------:|:--------------------:|
| **Unitarias de dominio** (objetos de valor y servicios puros) | Aisladas, deterministas, sin E/S | 126 (45 %) | Sí | ~100 % líneas / ~95 % ramas |
| **De casos de uso** (aplicación, con *test doubles* en memoria) | "Sociables": verifican la orquestación con dobles, no la implementación | 57 (20 %) | Sí | ~90 % líneas / ~85 % ramas |
| **De adaptador** (infraestructura, con *mocks* de los SDK) | Verifican el *mapeo* (p. ej. `23P01 → SlotTakenError`, cálculo de comisión), no la dependencia real | 90 (32 %) | Sí | ~90 % líneas / ~80 % ramas |
| **De componente** (Testing Library + happy-dom) | Validan lo que el usuario ve mediante roles y etiquetas accesibles (incluye interacción con `user-event`) | 6 (2 %) | No (valida presentación) | render e interacción |
| **Integración real** (contra PostgreSQL efímero) | Ejercitaría la restricción `EXCLUDE` y las políticas RLS de extremo a extremo | 0 | — | flujos críticos (línea futura) |
| **E2E** (Playwright, cross-browser) | Recorrido completo del usuario contra el despliegue en Chromium, Firefox y WebKit | 6 (automatizadas) | No (valida presentación) | flujo reservar → confirmar |

### F.2. Configuración actual

La cobertura se mide sobre las capas con lógica —dominio, aplicación e infraestructura— y define un **umbral** que actúa de puerta de calidad (`vitest.config.ts`):

```typescript
coverage: {
  provider: 'v8',
  include: ['src/domain/**', 'src/application/**', 'src/infrastructure/**'],
  exclude: [/* tipos e interfaces, clientes de SDK y glue de sesión */],
  thresholds: { statements: 90, functions: 90, lines: 90, branches: 80 },
}
```

Se **excluye** el *glue* sin lógica (clientes de SDK, `server.ts`, helpers de sesión) y la **capa de presentación** (`src/app`), cuya validación por líneas sería engañosa —esta se cubre con **pruebas de componente (Testing Library)** y **E2E cross-browser de Playwright**—. La medición se ejecuta en **integración continua** (`.github/workflows/ci.yml`), que **falla el *build*** por debajo del umbral. La cobertura real (≈ 96 % sentencias / 97 % líneas / 89 % ramas) supera holgadamente el umbral; la única categoría aún pendiente es la de **integración real** contra un PostgreSQL efímero.

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
