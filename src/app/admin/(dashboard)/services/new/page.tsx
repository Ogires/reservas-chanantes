import Link from 'next/link'
import { requireAdmin } from '@/infrastructure/supabase/admin-auth'
import { getAdminTranslations } from '@/infrastructure/i18n/admin-translations'
import { ServiceForm } from '../service-form'

export default async function NewServicePage() {
  const { tenant } = await requireAdmin()
  const t = getAdminTranslations(tenant.defaultLocale)

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/services"
          className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          &larr; {t.services.backToServices}
        </Link>
        <h1 className="text-2xl font-bold font-serif text-slate-900 mt-2">{t.services.newService}</h1>
      </div>
      <ServiceForm translations={{ services: t.services, common: t.common }} />
    </div>
  )
}
