import { requireAdmin } from '@/infrastructure/supabase/admin-auth'
import { SettingsForm } from './settings-form'

export default async function SettingsPage() {
  const { tenant } = await requireAdmin()

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Settings</h1>

      <SettingsForm
        name={tenant.name}
        timezone={tenant.bookingPolicy.timezone}
        minAdvanceMinutes={tenant.bookingPolicy.minAdvanceMinutes}
        maxAdvanceDays={tenant.bookingPolicy.maxAdvanceDays}
      />
    </div>
  )
}
