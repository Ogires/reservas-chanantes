import type { SupabaseClient } from '@supabase/supabase-js'
import type { Service } from '@/domain/entities/service'
import type { ServiceRepository } from '@/application/ports/service-repository'
import { Money } from '@/domain/value-objects/money'

interface ServiceRow {
  id: string
  tenant_id: string
  name: string
  duration_minutes: number
  price_cents: number
  active: boolean
}

function toDomain(row: ServiceRow): Service {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    durationMinutes: row.duration_minutes,
    price: new Money(row.price_cents, 'EUR'),
    active: row.active,
  }
}

export class SupabaseServiceRepository implements ServiceRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findByTenantId(tenantId: string): Promise<Service[]> {
    const { data, error } = await this.supabase
      .from('services')
      .select('*')
      .eq('tenant_id', tenantId)

    if (error) throw new Error(`Failed to fetch services: ${error.message}`)
    return (data ?? []).map(toDomain)
  }

  async findById(id: string): Promise<Service | null> {
    const { data, error } = await this.supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return null
    return toDomain(data)
  }

  async save(service: Service): Promise<Service> {
    const { data, error } = await this.supabase
      .from('services')
      .insert({
        id: service.id,
        tenant_id: service.tenantId,
        name: service.name,
        duration_minutes: service.durationMinutes,
        price_cents: service.price.amountCents,
        active: service.active,
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to save service: ${error.message}`)
    return toDomain(data)
  }

  async update(service: Service): Promise<Service> {
    const { data, error } = await this.supabase
      .from('services')
      .update({
        name: service.name,
        duration_minutes: service.durationMinutes,
        price_cents: service.price.amountCents,
        active: service.active,
      })
      .eq('id', service.id)
      .select()
      .single()

    if (error) throw new Error(`Failed to update service: ${error.message}`)
    return toDomain(data)
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('services')
      .delete()
      .eq('id', id)

    if (error) throw new Error(`Failed to delete service: ${error.message}`)
  }
}
