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
          className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          &larr; Back to services
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">Edit service</h1>
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
      <div className="mt-8">
        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-6">
          <h3 className="text-sm font-medium text-rose-800 mb-3">Danger zone</h3>
          <DeleteButton serviceId={service.id} />
        </div>
      </div>
    </div>
  )
}
