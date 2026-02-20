import type { SupabaseClient } from '@supabase/supabase-js'
import type { Tenant } from '@/domain/entities/tenant'
import type { TenantRepository } from '@/application/ports/tenant-repository'
import type { Currency, Locale } from '@/domain/types'

interface TenantRow {
  id: string
  owner_id: string
  name: string
  slug: string
  currency: string
  default_locale: string
  created_at: string
}

function toDomain(row: TenantRow): Tenant {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    slug: row.slug,
    currency: row.currency as Currency,
    defaultLocale: row.default_locale as Locale,
    createdAt: new Date(row.created_at),
  }
}

export class SupabaseTenantRepository implements TenantRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findBySlug(slug: string): Promise<Tenant | null> {
    const { data, error } = await this.supabase
      .from('tenants')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error || !data) return null
    return toDomain(data)
  }

  async findById(id: string): Promise<Tenant | null> {
    const { data, error } = await this.supabase
      .from('tenants')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return null
    return toDomain(data)
  }

  async findByOwnerId(ownerId: string): Promise<Tenant | null> {
    const { data, error } = await this.supabase
      .from('tenants')
      .select('*')
      .eq('owner_id', ownerId)
      .single()

    if (error || !data) return null
    return toDomain(data)
  }

  async save(tenant: Tenant): Promise<Tenant> {
    const { data, error } = await this.supabase
      .from('tenants')
      .insert({
        id: tenant.id,
        owner_id: tenant.ownerId,
        name: tenant.name,
        slug: tenant.slug,
        currency: tenant.currency,
        default_locale: tenant.defaultLocale,
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to save tenant: ${error.message}`)
    return toDomain(data)
  }
}
