import type { Locale } from '@/domain/types'
import type { EmailOtpType } from '@supabase/supabase-js'

/**
 * Renderizado i18n de los correos de autenticación (Supabase Send Email Hook).
 * Separado de los correos de reserva porque no tienen contexto de negocio:
 * son de la plataforma "Reservas Chanantes".
 */

type AuthKey =
  | 'signup'
  | 'recovery'
  | 'email_change'
  | 'magiclink'
  | 'invite'
  | 'reauthentication'
  | 'default'

interface AuthStrings {
  subject: string
  heading: string
  intro: string
  cta: string
  note: string
}

const STRINGS: Record<Locale, Record<AuthKey, AuthStrings>> = {
  'es-ES': {
    signup: {
      subject: 'Confirma tu cuenta · Reservas Chanantes',
      heading: 'Confirma tu cuenta',
      intro: 'Gracias por registrarte. Pulsa el botón para activar tu cuenta y acceder al panel.',
      cta: 'Confirmar mi cuenta',
      note: 'Si no te has registrado, ignora este correo.',
    },
    recovery: {
      subject: 'Restablece tu contraseña · Reservas Chanantes',
      heading: 'Restablece tu contraseña',
      intro: 'Hemos recibido una solicitud para cambiar tu contraseña. Pulsa el botón para elegir una nueva.',
      cta: 'Cambiar contraseña',
      note: 'Si no lo has solicitado, ignora este correo; tu contraseña no cambiará.',
    },
    email_change: {
      subject: 'Confirma tu nuevo email · Reservas Chanantes',
      heading: 'Confirma el cambio de email',
      intro: 'Pulsa el botón para confirmar tu nueva dirección de correo.',
      cta: 'Confirmar email',
      note: 'Si no has solicitado este cambio, ignora este correo.',
    },
    magiclink: {
      subject: 'Tu enlace de acceso · Reservas Chanantes',
      heading: 'Accede a tu cuenta',
      intro: 'Pulsa el botón para iniciar sesión.',
      cta: 'Iniciar sesión',
      note: 'Si no lo has solicitado, ignora este correo.',
    },
    invite: {
      subject: 'Te han invitado · Reservas Chanantes',
      heading: 'Has recibido una invitación',
      intro: 'Pulsa el botón para aceptar la invitación y crear tu cuenta.',
      cta: 'Aceptar invitación',
      note: '',
    },
    reauthentication: {
      subject: 'Código de verificación · Reservas Chanantes',
      heading: 'Verifica tu identidad',
      intro: 'Usa este código para continuar:',
      cta: '',
      note: 'Si no lo has solicitado, ignora este correo.',
    },
    default: {
      subject: 'Notificación de tu cuenta · Reservas Chanantes',
      heading: 'Notificación de tu cuenta',
      intro: 'Pulsa el botón para continuar.',
      cta: 'Continuar',
      note: '',
    },
  },
  'en-US': {
    signup: {
      subject: 'Confirm your account · Reservas Chanantes',
      heading: 'Confirm your account',
      intro: 'Thanks for signing up. Click the button to activate your account and access the dashboard.',
      cta: 'Confirm my account',
      note: "If you didn't sign up, ignore this email.",
    },
    recovery: {
      subject: 'Reset your password · Reservas Chanantes',
      heading: 'Reset your password',
      intro: 'We received a request to change your password. Click the button to choose a new one.',
      cta: 'Change password',
      note: "If you didn't request this, ignore this email; your password won't change.",
    },
    email_change: {
      subject: 'Confirm your new email · Reservas Chanantes',
      heading: 'Confirm your email change',
      intro: 'Click the button to confirm your new email address.',
      cta: 'Confirm email',
      note: "If you didn't request this change, ignore this email.",
    },
    magiclink: {
      subject: 'Your sign-in link · Reservas Chanantes',
      heading: 'Sign in to your account',
      intro: 'Click the button to sign in.',
      cta: 'Sign in',
      note: "If you didn't request this, ignore this email.",
    },
    invite: {
      subject: "You've been invited · Reservas Chanantes",
      heading: 'You have an invitation',
      intro: 'Click the button to accept the invitation and create your account.',
      cta: 'Accept invitation',
      note: '',
    },
    reauthentication: {
      subject: 'Verification code · Reservas Chanantes',
      heading: 'Verify your identity',
      intro: 'Use this code to continue:',
      cta: '',
      note: "If you didn't request this, ignore this email.",
    },
    default: {
      subject: 'Account notification · Reservas Chanantes',
      heading: 'Account notification',
      intro: 'Click the button to continue.',
      cta: 'Continue',
      note: '',
    },
  },
}

function normalizeKey(action: string): AuthKey {
  switch (action) {
    case 'signup':
    case 'recovery':
    case 'email_change':
    case 'magiclink':
    case 'invite':
    case 'reauthentication':
      return action
    default:
      return 'default'
  }
}

/** Mapea el `email_action_type` de Supabase al `type` de verifyOtp (para /api/auth/confirm). */
export function authOtpType(action: string): EmailOtpType {
  switch (action) {
    case 'signup':
      return 'signup'
    case 'recovery':
      return 'recovery'
    case 'email_change':
      return 'email_change'
    case 'magiclink':
      return 'magiclink'
    case 'invite':
      return 'invite'
    default:
      return 'email'
  }
}

function layout(locale: Locale, inner: string): string {
  const footer =
    locale === 'es-ES'
      ? 'Este es un mensaje automático de Reservas Chanantes.'
      : 'This is an automated message from Reservas Chanantes.'
  return `<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="utf-8" /></head>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333">
  <h2 style="color:#111">Reservas Chanantes</h2>
  ${inner}
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
  <p style="font-size:12px;color:#999">${footer}</p>
</body>
</html>`
}

/**
 * Construye el correo de auth localizado. `url` para acciones con enlace
 * (signup, recovery, email_change…); `code` para las de código (reauthentication).
 */
export function renderAuthEmail(
  action: string,
  locale: Locale,
  opts: { url?: string; code?: string }
): { subject: string; html: string } {
  const key = normalizeKey(action)
  const s = STRINGS[locale][key]

  let actionBlock = ''
  if (opts.url && s.cta) {
    actionBlock = `<p style="margin:24px 0">
      <a href="${opts.url}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">${s.cta}</a>
    </p>`
  } else if (opts.code) {
    actionBlock = `<p style="margin:24px 0;font-size:28px;font-weight:700;letter-spacing:4px;color:#111">${opts.code}</p>`
  } else if (opts.url) {
    actionBlock = `<p style="margin:24px 0"><a href="${opts.url}" style="color:#4f46e5">${opts.url}</a></p>`
  }

  const note = s.note
    ? `<p style="color:#666;font-size:13px">${s.note}</p>`
    : ''

  const html = layout(
    locale,
    `<h3 style="margin:16px 0 8px">${s.heading}</h3><p>${s.intro}</p>${actionBlock}${note}`
  )

  return { subject: s.subject, html }
}
