import { requireAdmin } from '@/infrastructure/supabase/admin-auth'
import { SupabaseBookingRepository } from '@/infrastructure/supabase/booking-repository'
import { SupabaseCustomerRepository } from '@/infrastructure/supabase/customer-repository'
import { SupabaseServiceRepository } from '@/infrastructure/supabase/service-repository'
import { getAdminTranslations } from '@/infrastructure/i18n/admin-translations'
import { BookingStatus } from '@/domain/types'
import { CancelBookingButton } from './cancel-button'

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const { tenant, supabase } = await requireAdmin()
  const t = getAdminTranslations(tenant.defaultLocale)
  const params = await searchParams

  const today = new Date()
  const weekLater = new Date(today)
  weekLater.setDate(weekLater.getDate() + 7)

  const from = params.from || toISODate(today)
  const to = params.to || toISODate(weekLater)

  const bookingRepo = new SupabaseBookingRepository(supabase)
  const customerRepo = new SupabaseCustomerRepository(supabase)
  const serviceRepo = new SupabaseServiceRepository(supabase)

  const bookings = await bookingRepo.findByTenantAndDateRange(tenant.id, from, to)

  const enriched = await Promise.all(
    bookings.map(async (booking) => {
      const [customer, service] = await Promise.all([
        customerRepo.findById(booking.customerId),
        serviceRepo.findById(booking.serviceId),
      ])
      return { booking, customer, service }
    })
  )

  const statusLabels: Record<BookingStatus, string> = {
    [BookingStatus.PENDING]: t.bookings.statusPending,
    [BookingStatus.CONFIRMED]: t.bookings.statusConfirmed,
    [BookingStatus.CANCELLED]: t.bookings.statusCancelled,
  }

  const statusStyles: Record<BookingStatus, string> = {
    [BookingStatus.PENDING]: 'bg-amber-100 text-amber-800',
    [BookingStatus.CONFIRMED]: 'bg-emerald-100 text-emerald-800',
    [BookingStatus.CANCELLED]: 'bg-slate-100 text-slate-600',
  }

  return (
    <div>
      <h1 className="text-2xl font-bold font-serif text-slate-900 mb-6">{t.bookings.title}</h1>

      <form className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="from" className="block text-sm font-medium text-slate-700 mb-1">
            {t.bookings.from}
          </label>
          <input
            id="from"
            name="from"
            type="date"
            defaultValue={from}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
          />
        </div>
        <div>
          <label htmlFor="to" className="block text-sm font-medium text-slate-700 mb-1">
            {t.bookings.to}
          </label>
          <input
            id="to"
            name="to"
            type="date"
            defaultValue={to}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700 transition-colors"
        >
          {t.common.filter}
        </button>
      </form>

      {enriched.length === 0 ? (
        <p className="text-slate-500">{t.bookings.noBookings}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--color-warm-border)] bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-stone-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">{t.bookings.date}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">{t.bookings.time}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">{t.bookings.service}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">{t.bookings.customer}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">{t.bookings.phone}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">{t.bookings.status}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">{t.bookings.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enriched.map(({ booking, customer, service }) => (
                <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-900">{booking.date}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-900">
                    {formatMinutes(booking.timeRange.start)} - {formatMinutes(booking.timeRange.end)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-900">{service?.name ?? t.common.unknown}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-900">{customer?.name ?? t.common.unknown}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">{customer?.phone ?? '-'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[booking.status]}`}>
                      {statusLabels[booking.status]}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    {booking.status !== BookingStatus.CANCELLED && (
                      <CancelBookingButton
                        bookingId={booking.id}
                        translations={{
                          confirmCancel: t.bookings.confirmCancel,
                          cancel: t.common.cancel,
                          cancelling: t.common.cancelling,
                        }}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
