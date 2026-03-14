import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/infrastructure/supabase/admin-auth'
import { SupabaseServiceRepository } from '@/infrastructure/supabase/service-repository'
import { getAdminTranslations } from '@/infrastructure/i18n/admin-translations'
import { ServiceForm } from '../../service-form'
import { DeleteButton } from './delete-button'

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { tenant, supabase } = await requireAdmin()
  const t = getAdminTranslations(tenant.defaultLocale)
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
          &larr; {t.services.backToServices}
        </Link>
        <h1 className="text-2xl font-bold font-serif text-slate-900 mt-2">{t.services.editService}</h1>
      </div>
      <ServiceForm
        service={{
          id: service.id,
          name: service.name,
          durationMinutes: service.durationMinutes,
          priceEur: service.price.amountCents / 100,
          active: service.active,
        }}
        translations={{ services: t.services, common: t.common }}
      />
      <div className="mt-8">
        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-6">
          <h3 className="text-sm font-medium text-rose-800 mb-3">{t.services.dangerZone}</h3>
          <DeleteButton
            serviceId={service.id}
            translations={{ confirmDelete: t.services.confirmDelete, deleteService: t.services.deleteService, deleting: t.common.deleting }}
          />
        </div>
      </div>
    </div>
  )
}
