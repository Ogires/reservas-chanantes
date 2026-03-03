import type { SupabaseClient } from '@supabase/supabase-js'
import type { Customer } from '@/domain/entities/customer'
import type { CustomerRepository } from '@/application/ports/customer-repository'

import type { Locale } from '@/domain/types'

interface CustomerRow {
  id: string
  name: string
  email: string
  phone: string
  auth_user_id: string | null
  preferred_locale: string | null
}

function toDomain(row: CustomerRow): Customer {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    authUserId: row.auth_user_id ?? undefined,
    preferredLocale: (row.preferred_locale as Locale) ?? undefined,
  }
}

export class SupabaseCustomerRepository implements CustomerRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findById(id: string): Promise<Customer | null> {
    const { data, error } = await this.supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return null
    return toDomain(data)
  }

  async findByEmail(email: string): Promise<Customer | null> {
    const { data, error } = await this.supabase
      .from('customers')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !data) return null
    return toDomain(data)
  }

  async findByAuthUserId(authUserId: string): Promise<Customer | null> {
    const { data, error } = await this.supabase
      .from('customers')
      .select('*')
      .eq('auth_user_id', authUserId)
      .single()

    if (error || !data) return null
    return toDomain(data)
  }

  async save(customer: Customer): Promise<Customer> {
    const { data, error } = await this.supabase
      .from('customers')
      .insert({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        auth_user_id: customer.authUserId ?? null,
        preferred_locale: customer.preferredLocale ?? null,
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to save customer: ${error.message}`)
    return toDomain(data)
  }

  async update(customer: Customer): Promise<Customer> {
    const { data, error } = await this.supabase
      .from('customers')
      .update({
        name: customer.name,
        phone: customer.phone,
        auth_user_id: customer.authUserId ?? null,
        preferred_locale: customer.preferredLocale ?? null,
      })
      .eq('id', customer.id)
      .select()
      .single()

    if (error) throw new Error(`Failed to update customer: ${error.message}`)
    return toDomain(data)
  }
}
