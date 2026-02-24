'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/infrastructure/supabase/server'

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
    return { error: error.message }
  }

  redirect('/admin/dashboard')
}

export async function resetPassword(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const email = formData.get('email') as string

  const supabase = await createSupabaseServer()
  const headersList = await headers()
  const host = headersList.get('x-forwarded-host') ?? headersList.get('host') ?? ''
  const proto = headersList.get('x-forwarded-proto') ?? 'https'
  const origin = host ? `${proto}://${host}` : ''

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: origin + '/admin/login',
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
