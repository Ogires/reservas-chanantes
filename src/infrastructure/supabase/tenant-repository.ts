import type { SupabaseClient } from '@supabase/supabase-js'
import type { Tenant } from '@/domain/entities/tenant'
import type { TenantRepository } from '@/application/ports/tenant-repository'
import type { Currency, Locale } from '@/domain/types'
import { TenantPlan } from '@/domain/types'
import { createBookingPolicy } from '@/domain/value-objects/booking-policy'
import type { BusinessCategory } from '@/domain/value-objects/business-category'

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
  plan?: string
  stripe_account_id: string | null
  stripe_account_enabled: boolean
  description: string | null
  category: string | null
  city: string | null
  address: string | null
  phone: string | null
  seo_title: string | null
  seo_description: string | null
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
    plan: (row.plan as TenantPlan) ?? TenantPlan.FREE,
    stripeAccountId: row.stripe_account_id ?? undefined,
    stripeAccountEnabled: row.stripe_account_enabled ?? false,
    description: row.description ?? undefined,
    category: (row.category as BusinessCategory) ?? undefined,
    city: row.city ?? undefined,
    address: row.address ?? undefined,
    phone: row.phone ?? undefined,
    seoTitle: row.seo_title ?? undefined,
    seoDescription: row.seo_description ?? undefined,
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

  async update(tenant: Tenant): Promise<Tenant> {
    const { data, error } = await this.supabase
      .from('tenants')
      .update({
        name: tenant.name,
        timezone: tenant.bookingPolicy.timezone,
        min_advance_minutes: tenant.bookingPolicy.minAdvanceMinutes,
        max_advance_days: tenant.bookingPolicy.maxAdvanceDays,
        description: tenant.description ?? null,
        category: tenant.category ?? 'LocalBusiness',
        city: tenant.city ?? null,
        address: tenant.address ?? null,
        phone: tenant.phone ?? null,
        seo_title: tenant.seoTitle ?? null,
        seo_description: tenant.seoDescription ?? null,
      })
      .eq('id', tenant.id)
      .select()
      .single()

    if (error) throw new Error(`Failed to update tenant: ${error.message}`)
    return toDomain(data)
  }

  async updateStripeAccount(
    tenantId: string,
    stripeAccountId: string,
    enabled: boolean
  ): Promise<void> {
    const { error } = await this.supabase
      .from('tenants')
      .update({
        stripe_account_id: stripeAccountId,
        stripe_account_enabled: enabled,
      })
      .eq('id', tenantId)

    if (error)
      throw new Error(`Failed to update stripe account: ${error.message}`)
  }

  async updateStripeAccountEnabled(
    stripeAccountId: string,
    enabled: boolean
  ): Promise<void> {
    const { error } = await this.supabase
      .from('tenants')
      .update({ stripe_account_enabled: enabled })
      .eq('stripe_account_id', stripeAccountId)

    if (error)
      throw new Error(
        `Failed to update stripe account enabled: ${error.message}`
      )
  }
}
