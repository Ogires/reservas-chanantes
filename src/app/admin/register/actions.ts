'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/infrastructure/supabase/server'
import { SupabaseTenantRepository } from '@/infrastructure/supabase/tenant-repository'
import { Slug } from '@/domain/value-objects/slug'
import { createBookingPolicy } from '@/domain/value-objects/booking-policy'

export async function register(
  _prevState: { error: string } | null,
  formData: FormData
) {
  const businessName = formData.get('businessName')
  if (typeof businessName !== 'string' || businessName.trim() === '') {
    return { error: 'Business name is required.' }
  }

  const isOAuthUser = formData.get('isOAuthUser') === 'true'

  const supabase = await createSupabaseServer()

  let userId: string

  if (isOAuthUser) {
    const { data: { user }, error } = await supabase.auth.getUser()
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
    })

    if (authError) {
      return { error: authError.message }
    }

    if (!authData.user) {
      return { error: 'Registration failed. Please try again.' }
    }

    userId = authData.user.id
  }

  try {
    const slug = Slug.fromName(businessName)
    const tenantRepo = new SupabaseTenantRepository(supabase)

    await tenantRepo.save({
      id: crypto.randomUUID(),
      ownerId: userId,
      name: businessName,
      slug: slug.value,
      currency: 'EUR',
      defaultLocale: 'es-ES',
      bookingPolicy: createBookingPolicy(),
      createdAt: new Date(),
    })
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'Failed to create business',
    }
  }

  redirect('/admin/dashboard')
}
