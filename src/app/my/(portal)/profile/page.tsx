import { requireCustomer } from '@/infrastructure/supabase/customer-auth'
import { ProfileForm } from './profile-form'

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ setup?: string }>
}) {
  const { customer } = await requireCustomer()
  const params = await searchParams
  const isSetup = params.setup === 'true'

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold font-serif text-slate-900">My profile</h2>
      <div className="rounded-xl border border-[var(--color-warm-border)] bg-white p-6 max-w-md">
        <ProfileForm
          name={customer.name}
          email={customer.email}
          phone={customer.phone}
          preferredLocale={customer.preferredLocale}
          isSetup={isSetup}
        />
      </div>
    </div>
  )
}
