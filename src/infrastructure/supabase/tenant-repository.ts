import type { SupabaseClient } from '@supabase/supabase-js'
import type { Tenant } from '@/domain/entities/tenant'
import type { TenantRepository } from '@/application/ports/tenant-repository'
import type { Currency, Locale } from '@/domain/types'
import { createBookingPolicy } from '@/domain/value-objects/booking-policy'

interface TenantRow {
  id: string
  owner_id: string
  name: string
  slug: string
  currency: string
  default_locale: string
  timezone: string
  min_advance_minutes: number
  max_advance_days: number
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
    bookingPolicy: createBookingPolicy({
      timezone: row.timezone,
      minAdvanceMinutes: row.min_advance_minutes,
      maxAdvanceDays: row.max_advance_days,
    }),
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
        timezone: tenant.bookingPolicy.timezone,
        min_advance_minutes: tenant.bookingPolicy.minAdvanceMinutes,
        max_advance_days: tenant.bookingPolicy.maxAdvanceDays,
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to save tenant: ${error.message}`)
    return toDomain(data)
  }
}
