import { requireAdmin } from '@/infrastructure/supabase/admin-auth'
import { SettingsForm } from './settings-form'
import { StripeConnectSection } from './stripe-connect-section'
import { StripeConnectServiceImpl } from '@/infrastructure/stripe/stripe-connect-service'

export default async function SettingsPage() {
  const { tenant } = await requireAdmin()

  let stripeDashboardUrl: string | undefined
  if (tenant.stripeAccountId && tenant.stripeAccountEnabled) {
    try {
      const connectService = new StripeConnectServiceImpl()
      stripeDashboardUrl = await connectService.createLoginLink(
        tenant.stripeAccountId
      )
    } catch {
      // Login link generation can fail if account is not fully onboarded
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold font-serif text-slate-900">Settings</h1>

      <StripeConnectSection
        stripeAccountId={tenant.stripeAccountId}
        stripeAccountEnabled={tenant.stripeAccountEnabled}
        stripeDashboardUrl={stripeDashboardUrl}
      />

      <SettingsForm
        name={tenant.name}
        timezone={tenant.bookingPolicy.timezone}
        minAdvanceMinutes={tenant.bookingPolicy.minAdvanceMinutes}
        maxAdvanceDays={tenant.bookingPolicy.maxAdvanceDays}
      />
    </div>
  )
}
