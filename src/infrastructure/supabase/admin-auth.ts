import { redirect } from 'next/navigation'
import { createSupabaseServer } from './server'
import { SupabaseTenantRepository } from './tenant-repository'

export async function requireAdmin() {
  const supabase = await createSupabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const tenantRepo = new SupabaseTenantRepository(supabase)
  const tenant = await tenantRepo.findByOwnerId(user.id)

  if (!tenant) {
    redirect('/admin/register')
  }

  return { tenant, supabase }
}
