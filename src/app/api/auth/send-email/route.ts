import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'standardwebhooks'
import { getResend } from '@/infrastructure/resend/client'
import { renderAuthEmail, authOtpType } from '@/infrastructure/resend/auth-email'
import type { Locale } from '@/domain/types'

const FROM = `Reservas Chanantes <reservas@${process.env.RESEND_FROM_DOMAIN ?? 'resend.dev'}>`
// Los enlaces de confirmación apuntan a NUESTRA app, no a la URL de Supabase
// (email_data.site_url es la URL de GoTrue, `…supabase.co/auth/v1`).
const APP_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://reservas-chanantes.vercel.app'

interface HookPayload {
  user: { email: string; user_metadata?: { locale?: string } }
  email_data: {
    token: string
    token_hash: string
    token_hash_new?: string
    redirect_to: string
    email_action_type: string
    site_url: string
  }
}

function resolveAuthLocale(raw?: string): Locale {
  return raw && raw.toLowerCase().startsWith('en') ? 'en-US' : 'es-ES'
}

/**
 * Auth Hook "Send Email" de Supabase: al activarlo, Supabase deja de enviar los
 * correos de autenticación y POSTea el evento aquí (firmado con HMAC / Standard
 * Webhooks). Renderizamos el correo en el idioma del usuario y lo enviamos por
 * Resend, cubriendo todos los `email_action_type`.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.SUPABASE_AUTH_HOOK_SECRET
  if (!secret) {
    console.error('[auth/send-email] SUPABASE_AUTH_HOOK_SECRET no configurado')
    return NextResponse.json({ error: 'not configured' }, { status: 500 })
  }

  const payload = await request.text()
  const headers = {
    'webhook-id': request.headers.get('webhook-id') ?? '',
    'webhook-timestamp': request.headers.get('webhook-timestamp') ?? '',
    'webhook-signature': request.headers.get('webhook-signature') ?? '',
  }

  let data: HookPayload
  try {
    const wh = new Webhook(secret.replace('v1,whsec_', ''))
    data = wh.verify(payload, headers) as HookPayload
  } catch (err) {
    console.error('[auth/send-email] firma inválida', err)
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }

  const { user, email_data } = data
  if (!user?.email) {
    return NextResponse.json({ error: 'no recipient' }, { status: 400 })
  }

  const action = email_data.email_action_type
  const locale = resolveAuthLocale(user.user_metadata?.locale)

  let opts: { url?: string; code?: string }
  if (action === 'reauthentication') {
    // Acción por código (no enlace): se muestra el OTP.
    opts = { code: email_data.token }
  } else {
    const tokenHash =
      action === 'email_change'
        ? email_data.token_hash_new ?? email_data.token_hash
        : email_data.token_hash
    const type = authOtpType(action)
    const next = email_data.redirect_to || `${APP_URL}/admin/dashboard`
    const url = `${APP_URL}/api/auth/confirm?token_hash=${encodeURIComponent(
      tokenHash
    )}&type=${type}&next=${encodeURIComponent(next)}`
    opts = { url }
  }

  const { subject, html } = renderAuthEmail(action, locale, opts)

  try {
    // Resend NO lanza en errores de API (rate limit, dominio, etc.): los
    // devuelve en `error`. Hay que comprobarlo o Supabase creería que el
    // correo se envió (200) cuando no fue así.
    const { error: sendError } = await getResend().emails.send({
      from: FROM,
      to: user.email,
      subject,
      html,
    })
    if (sendError) {
      console.error('[auth/send-email] error de Resend', sendError)
      return NextResponse.json({ error: 'send failed' }, { status: 500 })
    }
  } catch (err) {
    console.error('[auth/send-email] envío fallido', err)
    return NextResponse.json({ error: 'send failed' }, { status: 500 })
  }

  return NextResponse.json({})
}
