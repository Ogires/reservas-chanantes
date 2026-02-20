import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/infrastructure/supabase/admin-auth'
import { SupabaseServiceRepository } from '@/infrastructure/supabase/service-repository'
import { ServiceForm } from '../../service-form'
import { DeleteButton } from './delete-button'

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { supabase } = await requireAdmin()
  const serviceRepo = new SupabaseServiceRepository(supabase)
  const service = await serviceRepo.findById(id)

  if (!service) notFound()

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/services"
          className="text-sm text-blue-600 hover:underline"
        >
          &larr; Back to services
        </Link>
        <h1 className="text-2xl font-bold mt-2">Edit service</h1>
      </div>
      <ServiceForm
        service={{
          id: service.id,
          name: service.name,
          durationMinutes: service.durationMinutes,
          priceEur: service.price.amountCents / 100,
          active: service.active,
        }}
      />
      <div className="mt-8 border-t pt-6">
        <DeleteButton serviceId={service.id} />
      </div>
    </div>
  )
}
