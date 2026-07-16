import { requireCustomer } from '@/infrastructure/supabase/customer-auth'
import {
  getPortalTranslations,
  resolvePortalLocale,
} from '@/infrastructure/i18n/portal-translations'
import { ProfileForm } from './profile-form'

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ setup?: string }>
}) {
  const { customer } = await requireCustomer()
  const params = await searchParams
  const isSetup = params.setup === 'true'
  const t = getPortalTranslations(resolvePortalLocale(customer.preferredLocale))

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold font-serif text-slate-900">{t.myProfile}</h2>
      <div className="rounded-xl border border-[var(--color-warm-border)] bg-white p-6 max-w-md">
        <ProfileForm
          name={customer.name}
          email={customer.email}
          phone={customer.phone}
          preferredLocale={customer.preferredLocale}
          isSetup={isSetup}
          t={t}
        />
      </div>
    </div>
  )
}
