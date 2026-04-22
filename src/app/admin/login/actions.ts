'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/infrastructure/supabase/server'

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://reservas-chanantes.vercel.app'

export async function login(
  _prevState: { error: string } | null,
  formData: FormData
) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createSupabaseServer()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('[admin/login] auth error:', error.message)
    return { error: 'Credenciales inválidas' }
  }

  redirect('/admin/dashboard')
}

export async function resetPassword(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const email = formData.get('email') as string

  const supabase = await createSupabaseServer()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${SITE_URL}/admin/login`,
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
