# Plan: Correos de Auth multiidioma vía Send Email Hook (Opción C)

**Fecha:** 2026-07-08
**Estado:** propuesto (no implementado)
**Motivación:** las plantillas de Supabase Auth son de **un solo idioma**. Hoy usamos una plantilla bilingüe ES+EN como puente. La solución "de verdad" es un **Auth Hook "Send Email"**: Supabase deja de enviar los correos y **POSTea el evento a un endpoint nuestro**, que renderiza el correo en el idioma del usuario reutilizando la infraestructura i18n que ya tiene la app (`email-translations.ts` / `email-templates.ts`) y lo envía por **Resend** (`reservas@xanant.es`).

---

## 1. Cómo funciona el Send Email Hook (doc oficial)

- Se configura en **Authentication → Auth Hooks → Send Email Hook** como **HTTPS endpoint**. Al activarlo, Supabase **NO envía correos** (ni usa las plantillas del dashboard): manda un **POST** a nuestro endpoint.
- **Payload JSON:** `{ user, email_data }`.
  - `user`: id, email, `user_metadata`, etc.
  - `email_data`: `token` (OTP 6 díg.), **`token_hash`**, **`redirect_to`**, **`email_action_type`**, `site_url`, `token_new`/`token_hash_new` (para cambio de email).
- **Firma:** Standard Webhooks (HMAC). Secreto con formato **`v1,whsec_<base64>`**. Se verifica con la librería **`standardwebhooks`** (`new Webhook(secret).verify(rawBody, headers)`).
- **Respuesta OK:** `{}` con **HTTP 200**. En error, devolver JSON de error con status ≠ 2xx.
- **`email_action_type` posibles:** `signup`, `invite`, `magiclink`, `recovery`, `email_change`, `reauthentication` (+ notificaciones tipo `password_changed_notification`).

⚠️ **Implicación:** al activar el hook, **TODOS** los correos de auth pasan por nuestro endpoint. Debe ser fiable y **cubrir todos los tipos** que la app dispara (o tener fallback), o el registro/reset se rompería.

---

## 2. Qué dispara la app hoy (verificado en código)

- **`signup`** → registro de negocio (`admin/register/actions.ts`) y de cliente (`my/login/actions.ts`). **Se usa.**
- **`recovery`** → `admin/login/actions.ts::resetPassword` (`resetPasswordForEmail`, redirectTo `/admin/login`). **Se usa**, PERO ⚠️ **no existe página para fijar la nueva contraseña** (hueco preexistente): hoy el enlace de reset no lleva a ningún sitio útil.
- **`email_change`** → "Secure email change" está ON en Supabase; se dispararía si un usuario cambia su email (¿hay UI? a confirmar; el portal de cliente tiene `profile-form`).
- **`magiclink` / `invite` / `reauthentication`** → **no** los usa la app.

---

## 3. Alcance y decisiones

- **Idioma:** `user.user_metadata.locale` (lo pasaremos en `signUp` con `options.data.locale`, detectado con `detect-locale.ts`). Fallback: `es-ES`. Reutilizar `resolveLocale`.
- **Fases (cubrir por prioridad):**
  - **A (núcleo):** `signup` i18n → el objetivo real (correo de confirmación multiidioma).
  - **B (recovery):** correo de reset i18n **+ página para fijar contraseña** (arregla el hueco preexistente).
  - **C (completitud):** `email_change`, y **fallback genérico** para tipos no cubiertos (`magiclink`, `invite`, `reauthentication`, notificaciones) para no romper nada.
- **Fuera de alcance (limitación aparte):** la fragilidad **cross-browser PKCE** de la confirmación (el `token_hash` es `pkce_…` y `verifyOtp` necesita el cookie `code_verifier`). El hook **no** la resuelve por sí solo; su arreglo (flujo implícito u otra mecánica) se decide por separado. Se documenta como limitación conocida.

---

## 4. Cambios por fichero

### Dependencia y entorno
- `npm i standardwebhooks`.
- Nueva env var **`SUPABASE_AUTH_HOOK_SECRET`** (`v1,whsec_…`, la genera Supabase al crear el hook) → Vercel + `.env.local`.

### Presentación / infraestructura
- **NUEVA ruta `src/app/api/auth/send-email/route.ts`** (POST):
  1. Leer **raw body** + headers; **verificar firma** con `standardwebhooks` (`SUPABASE_AUTH_HOOK_SECRET`). Si falla → 401.
  2. Parsear `{ user, email_data }`. Resolver `locale` desde `user.user_metadata.locale`.
  3. Construir el enlace de acción según `email_action_type`:
     `${site_url}/api/auth/confirm?token_hash=${token_hash}&type=${mapType(action)}&next=${redirect_to}`
     (para `email_change` usar `token_hash_new`).
  4. Renderizar **subject + HTML localizados** (nuevas plantillas de auth).
  5. Enviar por **Resend** (`getResend().emails.send`, from `Reservas Chanantes <reservas@xanant.es>`).
  6. Devolver `{}` 200; en error, status ≠ 2xx + log.
  - Cubrir `signup` y `recovery`; `email_change` si aplica; **fallback genérico** (enlace + texto neutro) para el resto.
- **NUEVO módulo de plantillas de auth** (extender `email-translations.ts` con un bloque `auth: { confirmSignup, resetPassword, … }` es/en, y `email-templates.ts` con `buildAuthEmailHtml(...)`), coherente con el estilo de los correos de reserva.

### Aplicación (pasar locale + recovery)
- `admin/register/actions.ts` y `my/login/actions.ts`: añadir `options.data.locale` (detectado) en `signUp` — para que el hook sepa el idioma. (Admin ya pasa `business_name`; se añade `locale`.)
- **Fase B — reset de contraseña (arreglar hueco):**
  - **NUEVA página `src/app/admin/reset-password/`** (form + server action `updateUser({ password })`).
  - `admin/login/actions.ts::resetPassword` → `redirectTo` a `${SITE}/api/auth/confirm?...&type=recovery&next=/admin/reset-password` (o dejar que lo componga el hook).
  - `src/app/api/auth/confirm/route.ts`: rama `type==='recovery'` → tras `verifyOtp` (sesión de recuperación), **redirigir a `/admin/reset-password`** en vez de crear negocio/panel.

### Config (usuario)
- **Supabase → Auth Hooks → Send Email Hook → HTTPS** → URL `${SITE}/api/auth/send-email` → copiar el **secreto** → `SUPABASE_AUTH_HOOK_SECRET` en Vercel (+redeploy).
- Al activar el hook, la **plantilla "Confirm signup"** del dashboard queda **bypasseada** (la renderiza nuestro endpoint). La plantilla bilingüe queda solo como respaldo si se desactiva el hook.

---

## 5. Pruebas

- Unit: `mapType`, construcción del enlace, selección de plantilla por `email_action_type`, resolución de locale. (La verificación de firma y el envío son frontera externa; mockear `standardwebhooks` + `getResend`.)
- El endpoint no se testea de extremo a extremo en unit (webhook firmado); se prueba en el smoke test.
- Recuento: +N tests → actualizar en el barrido final.

## 6. Verificación (matriz)

| Flujo | ES | EN |
|---|---|---|
| Registro negocio → confirmación | ✅ | ✅ |
| Registro cliente → confirmación | ✅ | ✅ |
| Reset contraseña → correo + página de reset | ✅ | ✅ |

Test con buzones `@mailinator.com` (ES vía metadata `es-ES`, EN vía `en-US`). Verificar remitente `reservas@xanant.es` e idioma correcto.

## 7. Riesgos / limitaciones

- **Fiabilidad:** con el hook activo, si el endpoint falla, **ningún** correo de auth se envía → registro/reset rotos. Manejo de errores robusto + fallback para tipos desconocidos.
- **Cross-browser PKCE:** no lo resuelve el hook (limitación conocida, decisión aparte).
- **Rollback:** desactivar el hook en Supabase → Supabase vuelve a enviar con sus plantillas (la bilingüe). El código del endpoint es inerte si el hook está off.
- **Retrocompat:** todos los cambios de código son inertes mientras el hook no se active (salvo la página de reset y el `locale` en metadata, que son mejoras aditivas).

## 8. Orden de ejecución

1. Dep + env + módulo de plantillas de auth i18n (es/en) para `signup`.
2. Ruta `/api/auth/send-email` (verificación + signup + fallback) + tests.
3. `locale` en metadata de `signUp` (admin + cliente).
4. (Usuario) activar el hook en Supabase + env en Vercel → **test signup ES/EN**.
5. **Fase B:** página de reset + rama recovery en `/api/auth/confirm` + plantilla recovery → test reset ES/EN.
6. **Fase C:** email_change + fallback.
7. Barrido de docs (recuento + auth) en el sweep final.

## 9. Estimación / decisión de alcance

- **Mínimo viable (A):** confirmación de registro multiidioma. ~medio día.
- **Recomendado (A+B):** + reset de contraseña funcional (arregla un hueco real). ~1 día.
- **Completo (A+B+C):** + email_change + fallback. Algo más.

**Recomendación:** hacer **A+B** (cubre los flujos reales: registro y reset) con fallback genérico para el resto (mini-C). email_change solo si hay UI que lo dispare.
