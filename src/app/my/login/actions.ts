'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/infrastructure/supabase/server'

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://reservas-chanantes.vercel.app'

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
    return { error: 'Credenciales inválidas' }
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

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${SITE_URL}/my` },
  })

  if (error) {
    console.error('[my/register] auth error:', error.message)
    return { error: 'No se ha podido completar el registro' }
  }

  // Con la confirmación de email activada, signUp no devuelve sesión.
  if (!data.session) {
    return { needsConfirmation: true, email }
  }

  redirect('/my')
}
