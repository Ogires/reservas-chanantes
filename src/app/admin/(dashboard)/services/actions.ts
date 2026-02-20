'use server'

import { redirect } from 'next/navigation'
import { requireAdmin } from '@/infrastructure/supabase/admin-auth'
import { SupabaseServiceRepository } from '@/infrastructure/supabase/service-repository'
import { Money } from '@/domain/value-objects/money'

export async function saveService(
  _prevState: { error: string } | null,
  formData: FormData
) {
  const { tenant, supabase } = await requireAdmin()
  const serviceRepo = new SupabaseServiceRepository(supabase)

  const id = formData.get('id') as string | null
  const name = formData.get('name') as string
  const durationMinutes = Number(formData.get('durationMinutes'))
  const priceEur = Number(formData.get('price'))
  const active = formData.get('active') === 'on'

  const priceCents = Math.round(priceEur * 100)

  try {
    const service = {
      id: id || crypto.randomUUID(),
      tenantId: tenant.id,
      name,
      durationMinutes,
      price: new Money(priceCents, 'EUR'),
      active,
    }

    if (id) {
      await serviceRepo.update(service)
    } else {
      await serviceRepo.save(service)
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to save service' }
  }

  redirect('/admin/services')
}

export async function deleteService(
  _prevState: { error: string } | null,
  formData: FormData
) {
  const { supabase } = await requireAdmin()
  const serviceRepo = new SupabaseServiceRepository(supabase)

  const id = formData.get('id') as string

  try {
    await serviceRepo.delete(id)
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'Failed to delete service',
    }
  }

  redirect('/admin/services')
}
