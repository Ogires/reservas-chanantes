import { redirect } from 'next/navigation'
import { createSupabaseServer } from './server'
import { createSupabaseAdmin } from './admin-client'
import { SupabaseCustomerRepository } from './customer-repository'

export async function requireCustomer() {
  const supabase = await createSupabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/my/login')
  }

  // Ya enlazado: se lee con la sesión del cliente (RLS "self").
  const sessionRepo = new SupabaseCustomerRepository(supabase)
  const linked = await sessionRepo.findByAuthUserId(user.id)
  if (linked) return { customer: linked, supabase }

  // Enlace/creación: la fila destino puede estar aún sin enlazar (auth_user_id
  // NULL), fuera del alcance de la RLS "self", así que se hace con service-role
  // (operación de servidor de confianza tras validar la sesión).
  const adminRepo = new SupabaseCustomerRepository(createSupabaseAdmin())

  const existing = await adminRepo.findByEmail(user.email!)
  if (existing) {
    const customer = await adminRepo.update({ ...existing, authUserId: user.id })
    return { customer, supabase }
  }

  await adminRepo.save({
    id: crypto.randomUUID(),
    name: user.user_metadata?.full_name ?? user.email!.split('@')[0],
    email: user.email!,
    phone: '',
    authUserId: user.id,
  })

  redirect('/my/profile?setup=true')
}
