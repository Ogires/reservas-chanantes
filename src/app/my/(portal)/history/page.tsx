import Link from 'next/link'
import { requireCustomer } from '@/infrastructure/supabase/customer-auth'
import { SupabaseBookingRepository } from '@/infrastructure/supabase/booking-repository'
import { SupabaseServiceRepository } from '@/infrastructure/supabase/service-repository'
import { SupabaseTenantRepository } from '@/infrastructure/supabase/tenant-repository'
import { SupabaseCustomerRepository } from '@/infrastructure/supabase/customer-repository'
import { GetCustomerBookingsUseCase } from '@/application/use-cases/get-customer-bookings'
import { BookingStatus } from '@/domain/types'

const statusBadge: Record<string, { label: string; className: string }> = {
  [BookingStatus.CONFIRMED]: {
    label: 'Confirmed',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  [BookingStatus.PENDING]: {
    label: 'Pending',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  [BookingStatus.CANCELLED]: {
    label: 'Cancelled',
    className: 'bg-slate-100 text-slate-500 border-slate-200',
  },
}

export default async function HistoryPage() {
  const { customer, supabase } = await requireCustomer()

  const useCase = new GetCustomerBookingsUseCase(
    new SupabaseCustomerRepository(supabase),
    new SupabaseBookingRepository(supabase),
    new SupabaseServiceRepository(supabase),
    new SupabaseTenantRepository(supabase)
  )

  const allBookings = await useCase.execute({
    authUserId: customer.authUserId!,
  })

  // Group by tenant
  const grouped = new Map<string, typeof allBookings>()
  for (const item of allBookings) {
    const key = item.tenant?.slug ?? 'unknown'
    const existing = grouped.get(key) ?? []
    existing.push(item)
    grouped.set(key, existing)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold font-serif text-slate-900">Booking history</h2>

      {allBookings.length === 0 && (
        <div className="rounded-xl border border-[var(--color-warm-border)] bg-white p-8 text-center">
          <p className="text-slate-500">No bookings yet</p>
        </div>
      )}

      {Array.from(grouped.entries()).map(([slug, items]) => (
        <div key={slug} className="rounded-xl border border-[var(--color-warm-border)] bg-white overflow-hidden">
          <div className="bg-stone-50 px-5 py-3 border-b border-slate-200">
            <h3 className="font-medium text-slate-900">{items[0].tenant?.name ?? slug}</h3>
          </div>
          <ul className="divide-y divide-slate-100">
            {items.map(({ booking, service, tenant }) => {
              const badge = statusBadge[booking.status] ?? statusBadge[BookingStatus.PENDING]
              const isPast = booking.date < new Date().toISOString().split('T')[0]
              return (
                <li key={booking.id} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className={`font-medium ${booking.status === BookingStatus.CANCELLED ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                      {service?.name ?? 'Unknown service'}
                    </p>
                    <p className="text-sm text-slate-500">
                      {booking.date} &middot; {booking.timeRange.toHHMM().start} – {booking.timeRange.toHHMM().end}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
                      {badge.label}
                    </span>
                    {isPast && tenant && service && booking.status !== BookingStatus.CANCELLED && (
                      <Link
                        href={`/${tenant.slug}?service=${service.id}`}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        Book again
                      </Link>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}
