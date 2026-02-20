import type { SupabaseClient } from '@supabase/supabase-js'
import type { Customer } from '@/domain/entities/customer'
import type { CustomerRepository } from '@/application/ports/customer-repository'

interface CustomerRow {
  id: string
  name: string
  email: string
  phone: string | null
}

function toDomain(row: CustomerRow): Customer {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? undefined,
  }
}

export class SupabaseCustomerRepository implements CustomerRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findByEmail(email: string): Promise<Customer | null> {
    const { data, error } = await this.supabase
      .from('customers')
      .select('*')
      .eq('email', email)
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
        phone: customer.phone ?? null,
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to save customer: ${error.message}`)
    return toDomain(data)
  }
}
