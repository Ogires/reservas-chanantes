import { redirect } from 'next/navigation'
import { createSupabaseServer } from './server'
import { SupabaseCustomerRepository } from './customer-repository'

export async function requireCustomer() {
  const supabase = await createSupabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/my/login')
  }

  const customerRepo = new SupabaseCustomerRepository(supabase)

  // Already linked?
  let customer = await customerRepo.findByAuthUserId(user.id)
  if (customer) return { customer, supabase }

  // Try to link by email
  const existing = await customerRepo.findByEmail(user.email!)
  if (existing) {
    customer = await customerRepo.update({ ...existing, authUserId: user.id })
    return { customer, supabase }
  }

  // No customer record — create minimal one and redirect to profile setup
  customer = await customerRepo.save({
    id: crypto.randomUUID(),
    name: user.user_metadata?.full_name ?? user.email!.split('@')[0],
    email: user.email!,
    phone: '',
    authUserId: user.id,
  })

  redirect('/my/profile?setup=true')
}
