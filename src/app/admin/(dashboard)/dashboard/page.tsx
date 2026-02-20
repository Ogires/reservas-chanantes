import { requireAdmin } from '@/infrastructure/supabase/admin-auth'
import { SupabaseServiceRepository } from '@/infrastructure/supabase/service-repository'
import { SupabaseBookingRepository } from '@/infrastructure/supabase/booking-repository'
import Link from 'next/link'

export default async function DashboardPage() {
  const { tenant, supabase } = await requireAdmin()

  const serviceRepo = new SupabaseServiceRepository(supabase)
  const bookingRepo = new SupabaseBookingRepository(supabase)

  const services = await serviceRepo.findByTenantId(tenant.id)
  const activeServices = services.filter((s) => s.active)

  const today = new Date().toISOString().split('T')[0]
  const todayBookings = await bookingRepo.findByTenantAndDate(tenant.id, today)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border p-6">
          <p className="text-sm text-gray-500">Active services</p>
          <p className="text-3xl font-bold">{activeServices.length}</p>
        </div>

        <div className="rounded-lg border p-6">
          <p className="text-sm text-gray-500">Today&apos;s bookings</p>
          <p className="text-3xl font-bold">{todayBookings.length}</p>
        </div>

        <div className="rounded-lg border p-6">
          <p className="text-sm text-gray-500">Public page</p>
          <Link
            href={`/${tenant.slug}`}
            target="_blank"
            className="text-blue-600 hover:underline break-all"
          >
            /{tenant.slug}
          </Link>
        </div>
      </div>
    </div>
  )
}
