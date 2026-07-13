'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/infrastructure/supabase/server'
import { authLimiter } from '@/infrastructure/security/rate-limiter'
import { logSecurityEvent } from '@/infrastructure/observability/security-logger'

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://reservas-chanantes.vercel.app'

export async function login(
  _prevState: { error: string } | null,
  formData: FormData
) {
  const ip =
    (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!authLimiter.check(`login:${ip}`)) {
    logSecurityEvent({ type: 'rate_limited', ip, path: '/admin/login' })
    return { error: 'Demasiados intentos. Inténtalo de nuevo en un minuto.' }
  }

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createSupabaseServer()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('[admin/login] auth error:', error.message)
    logSecurityEvent({ type: 'login_failure', ip, email })
    return { error: 'Credenciales inválidas' }
  }

  logSecurityEvent({ type: 'login_success', ip, email })
  redirect('/admin/dashboard')
}

export async function resetPassword(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const ip =
    (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  // Anti-enumeración: ante rate-limit devolvemos el mismo `success: true`
  // neutro que el resto de ramas, sin revelar el motivo del rechazo.
  if (!authLimiter.check(`reset:${ip}`)) {
    return { success: true }
  }

  const email = formData.get('email') as string
  logSecurityEvent({ type: 'password_reset_requested', ip, email })

  const supabase = await createSupabaseServer()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${SITE_URL}/admin/reset-password`,
  })

  if (error) {
    console.error('[admin/resetPassword] auth error:', error.message)
    // Return success regardless of whether the email exists, to prevent
    // user enumeration. Supabase already follows this convention server-side
    // for the standard "user not found" case, but network/rate-limit errors
    // would leak otherwise.
    return { success: true }
  }

  return { success: true }
}
