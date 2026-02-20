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
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">{tenant.name}</h1>
      <p className="text-gray-500 mb-8">Book your appointment online</p>

      {activeServices.length === 0 ? (
        <p className="text-gray-500">
          No services available at the moment. Please check back later.
        </p>
      ) : (
        <BookingWidget slug={slug} services={services} />
      )}
    </div>
  )
}
