'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/infrastructure/supabase/admin-auth'
import { SupabaseTenantRepository } from '@/infrastructure/supabase/tenant-repository'
import { createBookingPolicy } from '@/domain/value-objects/booking-policy'

export async function saveSettings(
  _prevState: { error: string; success?: boolean } | null,
  formData: FormData
) {
  const { tenant, supabase } = await requireAdmin()
  const tenantRepo = new SupabaseTenantRepository(supabase)

  const name = (formData.get('name') as string)?.trim()
  const timezone = formData.get('timezone') as string
  const minAdvanceMinutes = Number(formData.get('minAdvanceMinutes'))
  const maxAdvanceDays = Number(formData.get('maxAdvanceDays'))

  if (!name) {
    return { error: 'Business name is required' }
  }
  if (isNaN(minAdvanceMinutes) || isNaN(maxAdvanceDays)) {
    return { error: 'Advance time and days must be valid numbers' }
  }

  try {
    const bookingPolicy = createBookingPolicy({
      timezone,
      minAdvanceMinutes,
      maxAdvanceDays,
    })

    await tenantRepo.update({
      ...tenant,
      name,
      bookingPolicy,
    })

    revalidatePath('/admin')
    return { error: '', success: true }
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'Failed to save settings',
    }
  }
}
