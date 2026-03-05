'use client'

interface StripeConnectSectionProps {
  stripeAccountId?: string
  stripeAccountEnabled: boolean
  stripeDashboardUrl?: string
}

export function StripeConnectSection({
  stripeAccountId,
  stripeAccountEnabled,
  stripeDashboardUrl,
}: StripeConnectSectionProps) {
  if (!stripeAccountId) {
    return (
      <div className="rounded-xl border border-[var(--color-warm-border)] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          Stripe payments
        </h2>
        <p className="text-sm text-slate-600 mb-4">
          Connect your Stripe account to receive payments from customers
          directly.
        </p>
        <a
          href="/api/stripe/connect"
          className="inline-flex items-center gap-2 rounded-lg bg-[#635bff] px-4 py-2.5 font-medium text-white shadow-sm hover:bg-[#5046e4] transition-colors"
        >
          Connect with Stripe
        </a>
      </div>
    )
  }

  if (!stripeAccountEnabled) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          Stripe payments
        </h2>
        <p className="text-sm text-amber-700">
          Your Stripe account is connected but pending verification. Stripe will
          email you when your account is ready to accept payments.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900 mb-2">
        Stripe payments
      </h2>
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
        <span className="text-sm font-medium text-emerald-700">Connected</span>
      </div>
      <p className="text-sm text-slate-600 mb-4">
        Your Stripe account is active and ready to accept payments.
      </p>
      {stripeDashboardUrl && (
        <a
          href={stripeDashboardUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
        >
          Open Stripe Dashboard
        </a>
      )}
    </div>
  )
}
