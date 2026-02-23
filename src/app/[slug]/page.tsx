import { cache } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createSupabaseServer } from '@/infrastructure/supabase/server'
import { SupabaseTenantRepository } from '@/infrastructure/supabase/tenant-repository'
import { SupabaseServiceRepository } from '@/infrastructure/supabase/service-repository'
import {
  getTenantLocalDate,
  addDaysToLocalDate,
} from '@/domain/services/tenant-clock'
import { BookingWidget } from './booking-widget'

const getTenant = cache(async (slug: string) => {
  const supabase = await createSupabaseServer()
  const tenantRepo = new SupabaseTenantRepository(supabase)
  return tenantRepo.findBySlug(slug)
})

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const tenant = await getTenant(slug)

  if (!tenant) {
    return { title: 'Not found' }
  }

  return {
    title: `Book with ${tenant.name}`,
    description: `Schedule your appointment online with ${tenant.name}.`,
  }
}

export default async function TenantPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const tenant = await getTenant(slug)

  if (!tenant) notFound()

  const { timezone, maxAdvanceDays } = tenant.bookingPolicy
  const today = getTenantLocalDate(timezone)
  const maxDate = addDaysToLocalDate(today, maxAdvanceDays)

  const supabase = await createSupabaseServer()
  const serviceRepo = new SupabaseServiceRepository(supabase)
  const allServices = await serviceRepo.findByTenantId(tenant.id)
  const activeServices = allServices.filter((s) => s.active)

  const services = activeServices.map((s) => ({
    id: s.id,
    name: s.name,
    durationMinutes: s.durationMinutes,
    priceFormatted: s.price.format(),
  }))

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">{tenant.name}</h1>
          <p className="mt-2 text-slate-500">Book your appointment online</p>
        </div>

        {activeServices.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-slate-500">
              No services available at the moment. Please check back later.
            </p>
          </div>
        ) : (
          <BookingWidget
            slug={slug}
            services={services}
            minDate={today}
            maxDate={maxDate}
          />
        )}
      </div>
    </div>
  )
}
