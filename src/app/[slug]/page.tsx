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

  const title = tenant.seoTitle || `Reserva cita en ${tenant.name}`
  const description =
    tenant.seoDescription ||
    `Reserva tu cita online en ${tenant.name}. Elige servicio, dia y hora disponible. Confirmacion inmediata.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
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

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://reservas-chanantes.vercel.app'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': tenant.category ?? 'LocalBusiness',
    name: tenant.name,
    url: `${baseUrl}/${slug}`,
    ...(tenant.description && { description: tenant.description }),
    ...(tenant.phone && { telephone: tenant.phone }),
    ...((tenant.address || tenant.city) && {
      address: {
        '@type': 'PostalAddress',
        ...(tenant.address && { streetAddress: tenant.address }),
        ...(tenant.city && { addressLocality: tenant.city }),
      },
    }),
    makesOffer: services.map((s) => ({
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name: s.name,
      },
    })),
  }

  return (
    <div className="min-h-screen bg-warm-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="font-serif text-3xl font-bold text-slate-900">{tenant.name}</h1>
          {tenant.description ? (
            <p className="mt-2 max-w-lg mx-auto text-slate-600">{tenant.description}</p>
          ) : (
            <p className="mt-2 text-slate-500">Book your appointment online</p>
          )}
          {(tenant.city || tenant.phone) && (
            <div className="mt-3 flex items-center justify-center gap-4 text-sm text-slate-500">
              {tenant.city && (
                <span className="flex items-center gap-1">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                  {tenant.city}
                </span>
              )}
              {tenant.phone && (
                <a href={`tel:${tenant.phone}`} className="flex items-center gap-1 hover:text-slate-700 transition-colors">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                  </svg>
                  {tenant.phone}
                </a>
              )}
            </div>
          )}
        </div>

        {activeServices.length === 0 ? (
          <div className="rounded-xl border border-warm-border bg-white p-8 text-center shadow-sm">
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
