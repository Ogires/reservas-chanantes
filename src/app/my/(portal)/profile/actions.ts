'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServer } from '@/infrastructure/supabase/server'
import { SupabaseCustomerRepository } from '@/infrastructure/supabase/customer-repository'
import { UpdateCustomerProfileUseCase } from '@/application/use-cases/update-customer-profile'
import type { Locale } from '@/domain/types'

export async function updateProfile(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const name = formData.get('name') as string
  const phone = formData.get('phone') as string
  const preferredLocale = (formData.get('preferredLocale') as string) || undefined

  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const useCase = new UpdateCustomerProfileUseCase(
    new SupabaseCustomerRepository(supabase)
  )

  try {
    await useCase.execute({
      authUserId: user.id,
      name,
      phone,
      preferredLocale: preferredLocale as Locale | undefined,
    })
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to update' }
  }

  revalidatePath('/my')
  return { success: true }
}
