'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/infrastructure/supabase/server'

export async function customerLogin(
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
    console.error('[my/login] auth error:', error.message)
    return { error: 'Credenciales inválidas' }
  }

  redirect('/my')
}

export async function customerRegister(
  _prevState: { error: string } | null,
  formData: FormData
) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createSupabaseServer()

  const { error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    console.error('[my/register] auth error:', error.message)
    return { error: 'No se ha podido completar el registro' }
  }

  redirect('/my')
}
