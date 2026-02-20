'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/infrastructure/supabase/server'
import { SupabaseTenantRepository } from '@/infrastructure/supabase/tenant-repository'
import { Slug } from '@/domain/value-objects/slug'

export async function register(
  _prevState: { error: string } | null,
  formData: FormData
) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const businessName = formData.get('businessName') as string

  const supabase = await createSupabaseServer()

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError) {
    return { error: authError.message }
  }

  if (!authData.user) {
    return { error: 'Registration failed. Please try again.' }
  }

  try {
    const slug = Slug.fromName(businessName)
    const tenantRepo = new SupabaseTenantRepository(supabase)

    await tenantRepo.save({
      id: crypto.randomUUID(),
      ownerId: authData.user.id,
      name: businessName,
      slug: slug.value,
      currency: 'EUR',
      defaultLocale: 'es-ES',
      createdAt: new Date(),
    })
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'Failed to create business',
    }
  }

  redirect('/admin/dashboard')
}
