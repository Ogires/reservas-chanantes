import { notFound } from 'next/navigation'
import { createSupabaseServer } from '@/infrastructure/supabase/server'
import { SupabaseTenantRepository } from '@/infrastructure/supabase/tenant-repository'
import { SupabaseServiceRepository } from '@/infrastructure/supabase/service-repository'
import { BookingWidget } from './booking-widget'

export default async function TenantPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createSupabaseServer()

  const tenantRepo = new SupabaseTenantRepository(supabase)
  const tenant = await tenantRepo.findBySlug(slug)

  if (!tenant) notFound()

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
          <BookingWidget slug={slug} services={services} />
        )}
      </div>
    </div>
  )
}
