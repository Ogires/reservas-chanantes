'use server'

import { getSiteUrl } from '@/infrastructure/config/site-url'
import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/infrastructure/supabase/server'
import { detectLocaleFromHeaders } from '@/infrastructure/i18n/detect-locale'

const SITE_URL =
  getSiteUrl()

export type CustomerAuthState =
  | { error: string }
  | { needsConfirmation: true; email: string }
  | null

export async function customerLogin(
  _prevState: CustomerAuthState,
  formData: FormData
): Promise<CustomerAuthState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createSupabaseServer()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('[my/login] auth error:', error.message)
    return { error: 'Invalid credentials' }
  }

  redirect('/my')
}

export async function customerRegister(
  _prevState: CustomerAuthState,
  formData: FormData
): Promise<CustomerAuthState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createSupabaseServer()

  const locale = await detectLocaleFromHeaders()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${SITE_URL}/my`, data: { locale } },
  })

  if (error) {
    console.error('[my/register] auth error:', error.message)
    return { error: 'Could not complete registration' }
  }

  // Con la confirmación de email activada, signUp no devuelve sesión.
  if (!data.session) {
    return { needsConfirmation: true, email }
  }

  redirect('/my')
}
