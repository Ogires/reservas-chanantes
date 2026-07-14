import type { SupabaseClient } from '@supabase/supabase-js'
import { SupabaseTenantRepository } from './tenant-repository'
import { Slug } from '@/domain/value-objects/slug'
import { createBookingPolicy } from '@/domain/value-objects/booking-policy'
import { TenantPlan } from '@/domain/types'

/**
 * Crea el negocio (tenant) del propietario si aún no existe. Idempotente: si ya
 * tiene uno, no hace nada. Se usa tanto en el registro directo (con sesión, si
 * la confirmación de email está desactivada) como en el callback de
 * confirmación de email (donde el negocio se crea al confirmar la cuenta).
 */
export async function provisionTenant(
  supabase: SupabaseClient,
  ownerId: string,
  businessName: string
): Promise<void> {
  const tenantRepo = new SupabaseTenantRepository(supabase)

  const existing = await tenantRepo.findByOwnerId(ownerId)
  if (existing) return

  const slug = Slug.fromName(businessName)

  await tenantRepo.save({
    id: crypto.randomUUID(),
    ownerId,
    name: businessName,
    slug: slug.value,
    currency: 'EUR',
    defaultLocale: 'es-ES',
    bookingPolicy: createBookingPolicy(),
    createdAt: new Date(),
    plan: TenantPlan.FREE,
    active: true,
    stripeAccountEnabled: false,
    allowOnSitePayment: false,
  })
}
