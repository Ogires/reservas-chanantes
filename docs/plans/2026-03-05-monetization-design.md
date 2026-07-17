# Plan: Monetizacion Hibrida (Freemium + Comision via Stripe Connect)

## Contexto

La app actualmente es 100% gratuita. Los pagos de reservas van a una unica cuenta de Stripe (la del platform owner). Los tenants no reciben dinero directamente y no hay planes ni limites.

**Objetivo:** Implementar un modelo hibrido donde:
- Los tenants conectan su propia cuenta de Stripe (Connect Standard)
- La plataforma cobra una comision automatica por reserva (5% Free, 1% Pro)
- Los tenants pueden pagar una suscripcion mensual (19€/mes) para desbloquear mas features

| | Free | Pro (19€/mes) |
|---|---|---|
| Servicios activos | 3 | Ilimitados |
| Reservas/mes | 50 | Ilimitadas |
| Recordatorios email | No | Si |
| Comision por reserva | 5% | 1% |

---

## Fase 1: Stripe Connect Standard

**Objetivo:** Los tenants conectan su cuenta de Stripe y reciben pagos directamente, con comision automatica para la plataforma.

### 1.1 Migracion DB
**Crear** `supabase/migrations/20260305_add_stripe_connect.sql`
- Anadir `stripe_account_id TEXT` y `stripe_account_enabled BOOLEAN DEFAULT false` a `tenants`
- Indice unico en `stripe_account_id`

### 1.2 Dominio
**Modificar** `src/domain/entities/tenant.ts` — anadir `stripeAccountId?: string`, `stripeAccountEnabled: boolean`
**Modificar** `src/domain/types.ts` — anadir enum `TenantPlan { FREE, PRO }`
**Crear** `src/domain/services/plan-limits.ts` — constantes de limites por plan y funcion `getCommissionRateBps(plan)`
**Modificar** `src/domain/errors/domain-errors.ts` — anadir `StripeAccountNotConnectedError`

### 1.3 Aplicacion
**Modificar** `src/application/ports/payment-service.ts` — anadir `stripeAccountId` y `commissionRateBps` a `CreateCheckoutRequest`
**Modificar** `src/application/ports/tenant-repository.ts` — anadir `updateStripeAccount()`
**Crear** `src/application/ports/stripe-connect-service.ts` — interfaz para OAuth de Connect
**Crear** `src/application/use-cases/connect-stripe-account.ts` — intercambia code OAuth por account ID

### 1.4 Infraestructura
**Modificar** `src/infrastructure/stripe/payment-service.ts`:
- Pasar `{ stripeAccount: request.stripeAccountId }` como opcion del API call (direct charge)
- Calcular y pasar `application_fee_amount` basado en `commissionRateBps`

**Crear** `src/infrastructure/stripe/stripe-connect-service.ts` — implementa OAuth: `exchangeOAuthCode`, `createOAuthLink`, `createLoginLink`
**Modificar** `src/infrastructure/supabase/tenant-repository.ts` — mapear nuevas columnas, implementar `updateStripeAccount`

### 1.5 Webhooks
**Modificar** `src/app/api/webhooks/stripe/route.ts` — anadir handler para `account.updated` (actualiza `stripe_account_enabled`)
**Crear** `src/app/api/webhooks/stripe-connect/route.ts` — nuevo endpoint para eventos de cuentas conectadas (aqui llega `checkout.session.completed` cuando se usa `stripeAccount`). Usa `STRIPE_CONNECT_WEBHOOK_SECRET`.

### 1.6 Rutas API (OAuth)
**Crear** `src/app/api/stripe/connect/route.ts` — genera URL OAuth de Stripe y redirige
**Crear** `src/app/api/stripe/connect/callback/route.ts` — recibe callback con `?code=...`, ejecuta use case

### 1.7 Server Action
**Modificar** `src/app/[slug]/actions.ts`:
- Verificar que el tenant tiene `stripeAccountId` y `stripeAccountEnabled`
- Calcular comision con `getCommissionRateBps(tenant.plan)`
- Pasar ambos al `createCheckoutSession`

### 1.8 UI
**Crear** `src/app/admin/(dashboard)/settings/stripe-connect-section.tsx` — boton "Conectar Stripe" + estado de conexion
**Modificar** `src/app/admin/(dashboard)/settings/page.tsx` — incluir la seccion de Connect

### 1.9 Variables de entorno nuevas
```
STRIPE_CONNECT_CLIENT_ID=ca_...
STRIPE_CONNECT_WEBHOOK_SECRET=whsec_...
```

---

## Fase 2: Sistema de Planes y Feature Gating

**Objetivo:** Aplicar los limites del plan Free (3 servicios, 50 bookings/mes, sin reminders).

### 2.1 Migracion DB
**Crear** `supabase/migrations/20260305_add_tenant_plan.sql`
- Anadir `plan TEXT NOT NULL DEFAULT 'FREE' CHECK (plan IN ('FREE', 'PRO'))` a `tenants`

### 2.2 Dominio
**Modificar** `src/domain/entities/tenant.ts` — anadir `plan: TenantPlan`
**Modificar** `src/domain/services/plan-limits.ts` — anadir funciones `canAddActiveService()`, `canCreateBooking()`, `canSendReminders()`
**Modificar** `src/domain/errors/domain-errors.ts` — anadir `ServiceLimitReachedError`, `BookingMonthlyLimitReachedError`

### 2.3 Aplicacion — Gating de bookings
**Modificar** `src/application/ports/booking-repository.ts` — anadir `countByTenantAndMonth(tenantId, yearMonth)`
**Modificar** `src/application/use-cases/create-booking.ts` — verificar limite mensual antes de crear
**Modificar** `src/infrastructure/supabase/booking-repository.ts` — implementar count query

### 2.4 Aplicacion — Gating de servicios
**Modificar** `src/application/ports/service-repository.ts` — anadir `countActiveByTenantId(tenantId)`
**Modificar** `src/infrastructure/supabase/service-repository.ts` — implementar count query
**Modificar** `src/app/admin/(dashboard)/services/actions.ts` — verificar limite al crear servicio activo

### 2.5 Gating de reminders
**Modificar** `src/app/api/cron/send-reminders/route.ts` — skip si `!canSendReminders(tenant.plan)`

### 2.6 UI
**Modificar** `src/app/admin/(dashboard)/sidebar.tsx` — badge de plan (Free/Pro)

---

## Fase 3: Suscripciones Stripe (Plan Pro)

**Objetivo:** Los tenants pueden pagar 19€/mes para upgrade a Pro via Stripe Subscriptions.

### 3.1 Setup manual en Stripe Dashboard
- Crear Product "Pro Plan" + Price 19€/mes recurrente
- Guardar el Price ID en `STRIPE_PRO_PRICE_ID`

### 3.2 Migracion DB
**Crear** `supabase/migrations/20260305_add_subscription_fields.sql`
- Anadir `stripe_customer_id`, `stripe_subscription_id`, `subscription_status` a `tenants`

### 3.3 Dominio
**Modificar** `src/domain/entities/tenant.ts` — anadir `stripeCustomerId?`, `stripeSubscriptionId?`, `subscriptionStatus?`

### 3.4 Aplicacion
**Modificar** `src/application/ports/payment-service.ts` — anadir `createSubscriptionCheckout()` y `createBillingPortalSession()`
**Modificar** `src/application/ports/tenant-repository.ts` — anadir `updateSubscription()`, `findByStripeCustomerId()`
**Crear** `src/application/use-cases/create-subscription-checkout.ts`
**Crear** `src/application/use-cases/create-billing-portal.ts`

### 3.5 Infraestructura
**Modificar** `src/infrastructure/stripe/payment-service.ts` — implementar `createSubscriptionCheckout` (`mode: 'subscription'`) y `createBillingPortalSession`
**Modificar** `src/infrastructure/supabase/tenant-repository.ts` — mapear columnas, implementar metodos

### 3.6 Webhooks
**Modificar** `src/app/api/webhooks/stripe/route.ts` — anadir handlers:
- `checkout.session.completed` (mode=subscription): set plan=PRO, guardar customer/subscription IDs
- `customer.subscription.updated`: actualizar status, plan=FREE si no activo
- `customer.subscription.deleted`: plan=FREE
- `invoice.payment_failed`: status=past_due (mantener PRO durante grace period)

### 3.7 Rutas API
**Crear** `src/app/api/stripe/subscription/checkout/route.ts` — inicia checkout de suscripcion
**Crear** `src/app/api/stripe/subscription/portal/route.ts` — redirige al billing portal de Stripe

### 3.8 UI
**Crear** `src/app/admin/(dashboard)/billing/page.tsx` — plan actual, tabla comparativa, boton upgrade, boton manage billing
**Modificar** `src/app/admin/(dashboard)/sidebar.tsx` — anadir enlace "Facturacion"

### 3.9 Variables de entorno nuevas
```
STRIPE_PRO_PRICE_ID=price_...
```

---

## Decisiones tecnicas clave

1. **Direct charges** (no destination charges): al pasar `{ stripeAccount }` como opcion del API call, el cargo se crea en la cuenta conectada. El tenant ve el cobro en su dashboard de Stripe. La plataforma cobra via `application_fee_amount`.

2. **Webhook separado para Connect**: los eventos de cuentas conectadas llegan a un endpoint distinto (`/api/webhooks/stripe-connect`) con su propio signing secret.

3. **Plan autoritativo en Supabase**: el webhook escribe `plan = PRO` o `plan = FREE` explicitamente. No se infiere del estado de suscripcion en runtime.

4. **Limite de bookings usa `date`, no `created_at`**: una reserva hecha el 31 dic para el 15 ene cuenta contra enero.

5. **Tenants existentes sin Connect**: al crear una reserva, si el tenant no tiene `stripeAccountId`, se muestra error "Pagos no configurados". Deben conectar su Stripe primero.

---

## Variables de entorno — resumen completo

| Variable | Fase | Donde obtenerla |
|---|---|---|
| `STRIPE_SECRET_KEY` | Ya existe | Stripe > Developers > API keys |
| `STRIPE_WEBHOOK_SECRET` | Ya existe | Stripe > Webhooks (platform) |
| `STRIPE_CONNECT_CLIENT_ID` | Fase 1 | Stripe > Connect > Settings |
| `STRIPE_CONNECT_WEBHOOK_SECRET` | Fase 1 | Stripe > Webhooks (Connect) |
| `STRIPE_PRO_PRICE_ID` | Fase 3 | Stripe > Products > Pro Plan > Price ID |

---

## Verificacion

### Fase 1
1. Crear tenant -> ir a Settings -> click "Conectar Stripe" -> completar OAuth
2. Verificar que `stripe_account_id` se guarda en DB
3. Hacer una reserva en la pagina publica del tenant
4. Verificar en Stripe Dashboard: el pago aparece en la cuenta conectada, con application_fee
5. Verificar webhook: reserva pasa a CONFIRMED

### Fase 2
1. Con plan FREE: intentar crear un 4o servicio -> error
2. Hacer 50 reservas en un mes -> la 51a falla con error de limite
3. Verificar que el cron de reminders salta tenants FREE

### Fase 3
1. Click "Upgrade a Pro" -> completa checkout de suscripcion
2. Verificar webhook: plan cambia a PRO en DB
3. Crear mas de 3 servicios -> funciona
4. Click "Gestionar facturacion" -> abre Stripe Billing Portal
5. Cancelar suscripcion desde portal -> plan vuelve a FREE
