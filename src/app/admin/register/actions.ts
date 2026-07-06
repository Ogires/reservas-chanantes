'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/infrastructure/supabase/server'
import { provisionTenant } from '@/infrastructure/supabase/provision-tenant'

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://reservas-chanantes.vercel.app'

export type RegisterState =
  | { error: string }
  | { needsConfirmation: true; email: string }
  | null

export async function register(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const businessName = formData.get('businessName')
  if (typeof businessName !== 'string' || businessName.trim() === '') {
    return { error: 'Business name is required.' }
  }
  const name = businessName.trim()

  const isOAuthUser = formData.get('isOAuthUser') === 'true'
  const supabase = await createSupabaseServer()

  let userId: string

  if (isOAuthUser) {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (error || !user) {
      return { error: 'Session expired. Please sign in again.' }
    }
    userId = user.id
  } else {
    const email = formData.get('email')
    const password = formData.get('password')

    if (typeof email !== 'string' || email.trim() === '') {
      return { error: 'Email is required.' }
    }
    if (typeof password !== 'string' || password.length < 6) {
      return { error: 'Password must be at least 6 characters.' }
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${SITE_URL}/admin/dashboard`,
        data: { business_name: name },
      },
    })

    if (authError) {
      return { error: authError.message }
    }
    if (!authData.user) {
      return { error: 'Registration failed. Please try again.' }
    }

    // Con la confirmación de email activada, signUp no devuelve sesión: el
    // negocio se crea al confirmar la cuenta (en /api/auth/confirm) usando el
    // business_name guardado en los metadatos del usuario.
    if (!authData.session) {
      return { needsConfirmation: true, email: email.trim() }
    }

    userId = authData.user.id
  }

  try {
    await provisionTenant(supabase, userId, name)
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'Failed to create business',
    }
  }

  redirect('/admin/dashboard')
}
