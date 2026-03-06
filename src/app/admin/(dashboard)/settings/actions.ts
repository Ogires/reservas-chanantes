'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/infrastructure/supabase/admin-auth'
import { SupabaseTenantRepository } from '@/infrastructure/supabase/tenant-repository'
import { createBookingPolicy } from '@/domain/value-objects/booking-policy'
import type { Tenant } from '@/domain/entities/tenant'
import { BUSINESS_CATEGORIES } from '@/domain/value-objects/business-category'

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

  const description = (formData.get('description') as string)?.trim() || undefined
  const rawCategory = (formData.get('category') as string) || undefined
  const category = rawCategory && (BUSINESS_CATEGORIES as readonly string[]).includes(rawCategory)
    ? rawCategory
    : undefined
  const city = (formData.get('city') as string)?.trim() || undefined
  const address = (formData.get('address') as string)?.trim() || undefined
  const phone = (formData.get('phone') as string)?.trim() || undefined
  const seoTitle = (formData.get('seoTitle') as string)?.trim() || undefined
  const seoDescription = (formData.get('seoDescription') as string)?.trim() || undefined

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
      description,
      category: category as Tenant['category'],
      city,
      address,
      phone,
      seoTitle,
      seoDescription,
    })

    revalidatePath('/admin')
    revalidatePath(`/${tenant.slug}`)
    return { error: '', success: true }
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'Failed to save settings',
    }
  }
}
