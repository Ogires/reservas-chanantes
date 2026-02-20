import Link from 'next/link'
import { requireAdmin } from '@/infrastructure/supabase/admin-auth'
import { SupabaseServiceRepository } from '@/infrastructure/supabase/service-repository'

export default async function ServicesPage() {
  const { tenant, supabase } = await requireAdmin()
  const serviceRepo = new SupabaseServiceRepository(supabase)
  const services = await serviceRepo.findByTenantId(tenant.id)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Services</h1>
        <Link
          href="/admin/services/new"
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          New service
        </Link>
      </div>

      {services.length === 0 ? (
        <p className="text-gray-500">
          No services yet. Create your first service to get started.
        </p>
      ) : (
        <div className="space-y-2">
          {services.map((service) => (
            <div
              key={service.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div>
                <p className="font-medium">{service.name}</p>
                <p className="text-sm text-gray-500">
                  {service.durationMinutes} min &middot;{' '}
                  {service.price.format()}
                  {!service.active && (
                    <span className="ml-2 text-orange-500">(inactive)</span>
                  )}
                </p>
              </div>
              <Link
                href={`/admin/services/${service.id}/edit`}
                className="text-sm text-blue-600 hover:underline"
              >
                Edit
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
