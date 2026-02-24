import { requireAdmin } from '@/infrastructure/supabase/admin-auth'
import { SupabaseBookingRepository } from '@/infrastructure/supabase/booking-repository'
import { SupabaseCustomerRepository } from '@/infrastructure/supabase/customer-repository'
import { SupabaseServiceRepository } from '@/infrastructure/supabase/service-repository'
import { BookingStatus } from '@/domain/types'
import { CancelBookingButton } from './cancel-button'

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function statusBadge(status: BookingStatus) {
  const styles: Record<BookingStatus, string> = {
    [BookingStatus.PENDING]: 'bg-amber-100 text-amber-800',
    [BookingStatus.CONFIRMED]: 'bg-emerald-100 text-emerald-800',
    [BookingStatus.CANCELLED]: 'bg-slate-100 text-slate-600',
  }
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  )
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Bookings</h1>

      <form className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="from" className="block text-sm font-medium text-slate-700 mb-1">
            From
          </label>
          <input
            id="from"
            name="from"
            type="date"
            defaultValue={from}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
        </div>
        <div>
          <label htmlFor="to" className="block text-sm font-medium text-slate-700 mb-1">
            To
          </label>
          <input
            id="to"
            name="to"
            type="date"
            defaultValue={to}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors"
        >
          Filter
        </button>
      </form>

      {enriched.length === 0 ? (
        <p className="text-slate-500">No bookings in this period.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Service</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enriched.map(({ booking, customer, service }) => (
                <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-900">{booking.date}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-900">
                    {formatMinutes(booking.timeRange.start)} - {formatMinutes(booking.timeRange.end)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-900">{service?.name ?? 'Unknown'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-900">{customer?.name ?? 'Unknown'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">{customer?.phone ?? '-'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">{statusBadge(booking.status)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    {booking.status !== BookingStatus.CANCELLED && (
                      <CancelBookingButton bookingId={booking.id} />
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
