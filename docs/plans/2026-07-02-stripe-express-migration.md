# Plan de migración: Stripe Connect Standard (OAuth) → Express

**Fecha:** 2026-07-02
**Estado:** propuesto (no implementado)
**Motivación:** reducir la fricción de alta del comercio (el onboarding completo de Standard bloquea el cobro online) manteniendo la comisión por transacción. El cliente sigue pagando con cargo directo + `application_fee`.

---

## 1. Objetivo y alcance

**Objetivo:** sustituir el flujo de conexión OAuth de cuentas Standard por el modelo **Express** (la plataforma crea la cuenta por API y envía al comercio a un onboarding ligero alojado por Stripe).

**Dentro del alcance:** solo la **capa de conexión** (Connect).
**Fuera del alcance (no cambia):** el cobro (`payment-service.ts`: direct charge + `application_fee`), el dominio (`Tenant.stripeAccountId`/`stripeAccountEnabled` siguen igual), el flujo de reserva, el pago en el centro, los webhooks de `checkout.session.completed`.

**Beneficio colateral:** elimina el bloqueo actual (`charges_enabled=false` tras "Omitir formulario"), porque Express usa un onboarding corto que sí completa la cuenta.

---

## 2. Diseño

Flujo Express (confirmado con la doc oficial de Stripe):

1. **Crear cuenta**: `accounts.create({ type:'express', country:'ES', email, capabilities:{ card_payments:{requested:true}, transfers:{requested:true} } })` → `acct_…`.
2. **Link de onboarding**: `accountLinks.create({ account, return_url, refresh_url, type:'account_onboarding' })` → `url` (un solo uso) → redirigir.
3. **Al volver** (`return_url`): `accounts.retrieve(id)` → comprobar `charges_enabled` → actualizar el tenant.

Se elimina OAuth: ya **no hay `client_id`, ni `oauth.authorizeUrl`, ni `oauth.token`, ni intercambio de `code`**.

Dos fases claras:
- **Iniciar** (`GET /api/stripe/connect`): crear-o-reusar cuenta + guardar `stripe_account_id` + crear link + redirigir.
- **Volver** (`GET /api/stripe/connect/callback` como `return_url`): recuperar estado + actualizar `stripe_account_enabled`.

---

## 3. Cambios por capa (Arquitectura Limpia)

### Dominio
- **Sin cambios.** `Tenant.stripeAccountId` / `stripeAccountEnabled` sirven igual (ambos modelos usan un `acct_…`).

### Aplicación
- **Puerto** `application/ports/stripe-connect-service.ts`:
  - Quitar `createOAuthLink`, `exchangeOAuthCode` (+ tipo `OAuthExchangeResult`).
  - Añadir `createExpressAccount(input: { email?: string; country?: string }): Promise<string>` (devuelve `acct_…`).
  - Añadir `createOnboardingLink(accountId: string, returnUrl: string, refreshUrl: string): Promise<string>` (devuelve url).
  - Mantener `createLoginLink`, `isChargesEnabled`.
- **Casos de uso** (sustituir `connect-stripe-account.ts`):
  - `StartStripeOnboardingUseCase.execute({ tenant, returnUrl, refreshUrl }): Promise<string>` → si `tenant.stripeAccountId` no existe, crea la cuenta y persiste (`updateStripeAccount(tenantId, acct, false)`); crea y devuelve el link de onboarding.
  - `RefreshStripeAccountUseCase.execute({ tenant }): Promise<void>` → `isChargesEnabled(tenant.stripeAccountId)` → `updateStripeAccountEnabled(...)`.
- **Puerto** `TenantRepository`: ya tiene `updateStripeAccount(id, accountId, enabled)` y `updateStripeAccountEnabled(accountId, enabled)`. Reutilizar (posible ajuste: `updateStripeAccountEnabled` filtra por `stripe_account_id`; en "refresh" ya lo tenemos, vale).

### Infraestructura
- `infrastructure/stripe/stripe-connect-service.ts`:
  - `createExpressAccount` → `getStripe().accounts.create({ type:'express', ... })` → `account.id`.
  - `createOnboardingLink` → `getStripe().accountLinks.create({ account, return_url, refresh_url, type:'account_onboarding' })` → `link.url`.
  - Mantener `createLoginLink` (`accounts.createLoginLink`, válido para Express) e `isChargesEnabled`.
  - Eliminar `createOAuthLink` / `exchangeOAuthCode`.

### Presentación
- `app/api/stripe/connect/route.ts` (GET): `requireAdmin` → `StartStripeOnboardingUseCase` (return_url = `${origin}/api/stripe/connect/callback`, refresh_url = `${origin}/api/stripe/connect`) → `redirect(url)`.
- `app/api/stripe/connect/callback/route.ts` (GET): `requireAdmin` → `RefreshStripeAccountUseCase` → `redirect('/admin/settings?stripe_connected=true')`. **Sin** lectura de `code`.
- `app/admin/(dashboard)/settings/stripe-connect-section.tsx`: el enlace "Conectar con Stripe" puede pasar a "Configurar cobros" / "Continuar verificación" según estado (`stripeAccountId` presente pero `enabled=false`). Aprovechar para corregir el lint preexistente (`<a>` → comportamiento correcto).

---

## 4. Pruebas (TDD)

- **No hay tests que implementen `StripeConnectService`** (verificado), así que el cambio de puerto no rompe la suite.
- Añadir:
  - `StartStripeOnboardingUseCase.test.ts`: (a) crea cuenta y persiste cuando no hay `stripeAccountId`; (b) reutiliza la existente; (c) devuelve el link.
  - `RefreshStripeAccountUseCase.test.ts`: propaga `charges_enabled` a `updateStripeAccountEnabled`.
- La impl de infraestructura (SDK Stripe) no se testea unitariamente (frontera externa), coherente con el resto.
- ⚠️ **Recuento de pruebas**: subirá de 197 → ~200. Actualizar el número (README, memoria cap.6/7 + hub, deck) en un barrido final, como se hizo antes.

---

## 5. Configuración en el dashboard de Stripe (acción del usuario)

- **Activar Express** en Connect (Settings → Connect). En test suele estar disponible al tener Connect configurado.
- (Opcional) Branding del onboarding Express.
- Dejan de usarse: `client_id` (`ca_…`), la Redirect URI de OAuth y el webhook `account.updated` de OAuth (no estorban si se quedan).

---

## 6. Variables de entorno

- `STRIPE_CONNECT_CLIENT_ID` → **deja de usarse** (se puede quitar de Vercel y `.env.local`).
- El resto (`STRIPE_SECRET_KEY`, `STRIPE_CONNECT_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, etc.) **sin cambios**.

---

## 7. Migración de datos

- Las cuentas conectadas por OAuth (p. ej. la de test `acct_1ToP3xL8wk4ily1x`, pendiente) quedan obsoletas. Al reconectar por Express se **crea una cuenta nueva** y se sobrescribe `stripe_account_id`. No hay migración de fondos (test).

---

## 8. Verificación / smoke test

1. `npx tsc --noEmit`, `npx vitest run`, `npm run build`.
2. Deploy. Con la demo (`peluqueria-aurora`): Ajustes → "Conectar con Stripe" → onboarding Express ligero → verificar `charges_enabled=true`.
3. Reserva online con tarjeta `4242 4242 4242 4242` → confirmar que pasa a `CONFIRMED` vía webhook `checkout.session.completed`.

---

## 9. Riesgos y consideraciones

- **Responsabilidad/fees:** en Express la plataforma asume más por defecto (paga las *fees* de Stripe; configurable con `controller`). Irrelevante en test; a valorar para producción.
- **Accounts v2 / versión de API:** `accounts.create({type:'express'})` (API v1 vía SDK v20) sigue vigente; `charges_enabled` se lee igual con `accounts.retrieve`.
- **`controller` moderno:** Stripe permite `controller` en vez de `type:'express'` para afinar liabilidad/dashboard. Se opta por `type:'express'` (más simple).
- **Coste de docs:** actualizar menciones "Standard/OAuth" → "Express" en memoria (§2.7, §5.5, anexos) y `DESPLIEGUE.local.md` §3.2.

---

## 10. Rollback

Cambio acotado en la capa de Connect, en rama propia. El código Standard queda en el historial de Git; revertir el commit restaura OAuth.

---

## 11. Orden de ejecución sugerido

1. Puerto + impl (infra) con los métodos Express.
2. Casos de uso nuevos + sus tests.
3. Rutas `connect` y `callback`.
4. Ajuste del `stripe-connect-section.tsx`.
5. `tsc` + `vitest` + `build`.
6. (Usuario) activar Express en Stripe.
7. Deploy + smoke test online.
8. Barrido de documentación (número de pruebas, Standard→Express).
