'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/infrastructure/supabase/server'
import { detectLocaleFromHeaders } from '@/infrastructure/i18n/detect-locale'
import { getAdminTranslations } from '@/infrastructure/i18n/admin-translations'

export type ResetPasswordState = { error: string } | null

/**
 * Fija la nueva contraseña. Se llega aquí desde el enlace de recuperación
 * (`/api/auth/confirm?type=recovery` → verifyOtp establece la sesión), así que
 * `updateUser` opera sobre esa sesión de recuperación.
 */
export async function updatePassword(
  _prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const t = getAdminTranslations(await detectLocaleFromHeaders()).auth
  const password = formData.get('password')
  const confirm = formData.get('confirm')

  if (
    typeof password !== 'string' ||
    typeof confirm !== 'string' ||
    password !== confirm
  ) {
    return { error: t.passwordMismatch }
  }

  const supabase = await createSupabaseServer()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    console.error('[admin/updatePassword] error:', error.message)
    return { error: t.resetLinkInvalid }
  }

  redirect('/admin/dashboard')
}
