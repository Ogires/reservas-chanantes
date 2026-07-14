'use server'

import { revalidatePath } from 'next/cache'
import { requireSuperadmin } from '@/infrastructure/auth/superadmin'
import { createSupabaseAdmin } from '@/infrastructure/supabase/admin-client'
import { SupabasePlatformRepository } from '@/infrastructure/supabase/platform-repository'

/**
 * Activa/desactiva un negocio-cliente desde el panel de superadmin.
 *
 * `requireSuperadmin()` se ejecuta PRIMERO (fail-closed): nunca se usa el
 * service-role antes de validar al operador. La desactivación bloquea el flujo
 * público de reservas del negocio (ver enforcement en los casos de uso).
 */
export async function toggleTenantActive(
  tenantId: string,
  active: boolean
): Promise<void> {
  await requireSuperadmin()
  const admin = createSupabaseAdmin()
  await new SupabasePlatformRepository(admin).setTenantActive(tenantId, active)
  revalidatePath('/superadmin')
}
