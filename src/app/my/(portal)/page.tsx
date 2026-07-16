import Link from 'next/link'
import { requireCustomer } from '@/infrastructure/supabase/customer-auth'
import { SupabaseBookingRepository } from '@/infrastructure/supabase/booking-repository'
import { SupabaseServiceRepository } from '@/infrastructure/supabase/service-repository'
import { SupabaseTenantRepository } from '@/infrastructure/supabase/tenant-repository'
import { GetCustomerBookingsUseCase } from '@/application/use-cases/get-customer-bookings'
import { SupabaseCustomerRepository } from '@/infrastructure/supabase/customer-repository'
import { BookingStatus } from '@/domain/types'
import { paymentPresentation } from '@/domain/services/payment-presentation'
import { PaymentBadge } from '@/app/_components/payment-badge'
import {
  getPortalTranslations,
  resolvePortalLocale,
} from '@/infrastructure/i18n/portal-translations'
import { CancelBookingButton } from './cancel-booking-button'

export default async function MyDashboardPage() {
  const { customer, supabase } = await requireCustomer()
  const t = getPortalTranslations(resolvePortalLocale(customer.preferredLocale))

  const useCase = new GetCustomerBookingsUseCase(
    new SupabaseCustomerRepository(supabase),
    new SupabaseBookingRepository(supabase),
    new SupabaseServiceRepository(supabase),
    new SupabaseTenantRepository(supabase)
  )

  const allBookings = await useCase.execute({
    authUserId: customer.authUserId!,
  })

  const paymentLabels = {
    PAID_ONLINE: t.paymentPaid,
    PENDING_ONLINE: t.paymentPending,
    ON_SITE: t.paymentOnsite,
  }

  const today = new Date().toISOString().split('T')[0]
  const upcoming = allBookings.filter(
    (b) =>
      b.booking.date >= today &&
      b.booking.status !== BookingStatus.CANCELLED
  )

  // Group by tenant
  const grouped = new Map<string, typeof upcoming>()
  for (const item of upcoming) {
    const key = item.tenant?.slug ?? 'unknown'
    const existing = grouped.get(key) ?? []
    existing.push(item)
    grouped.set(key, existing)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold font-serif text-slate-900">{t.upcomingBookings}</h2>

      {upcoming.length === 0 && (
        <div className="rounded-xl border border-[var(--color-warm-border)] bg-white p-8 text-center">
          <p className="text-slate-500">{t.noUpcoming}</p>
        </div>
      )}

      {Array.from(grouped.entries()).map(([slug, items]) => (
        <div key={slug} className="rounded-xl border border-[var(--color-warm-border)] bg-white overflow-hidden">
          <div className="bg-stone-50 px-5 py-3 border-b border-slate-200">
            <h3 className="font-medium text-slate-900">{items[0].tenant?.name ?? slug}</h3>
          </div>
          <ul className="divide-y divide-slate-100">
            {items.map(({ booking, service, tenant }) => (
              <li key={booking.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-medium text-slate-900">
                    {service?.name ?? t.unknownService}
                  </p>
                  <p className="text-sm text-slate-500">
                    {booking.date} &middot; {booking.timeRange.toHHMM().start} – {booking.timeRange.toHHMM().end}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {(() => {
                    const payKey = paymentPresentation(booking)
                    return payKey ? <PaymentBadge paymentKey={payKey} labels={paymentLabels} /> : null
                  })()}
                  <CancelBookingButton
                    bookingId={booking.id}
                    labels={{ cancel: t.cancel, cancelling: t.cancelling, cancelled: t.cancelled }}
                  />
                  {tenant && service && (
                    <Link
                      href={`/${tenant.slug}?service=${service.id}`}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      {t.bookAgain}
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
