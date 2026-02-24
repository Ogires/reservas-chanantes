import { requireAdmin } from '@/infrastructure/supabase/admin-auth'
import { SupabaseServiceRepository } from '@/infrastructure/supabase/service-repository'
import { SupabaseBookingRepository } from '@/infrastructure/supabase/booking-repository'
import { SupabaseScheduleRepository } from '@/infrastructure/supabase/schedule-repository'
import { SetupChecklist } from './setup-checklist'
import Link from 'next/link'

export default async function DashboardPage() {
  const { tenant, supabase } = await requireAdmin()

  const serviceRepo = new SupabaseServiceRepository(supabase)
  const bookingRepo = new SupabaseBookingRepository(supabase)
  const scheduleRepo = new SupabaseScheduleRepository(supabase)

  const [services, schedule] = await Promise.all([
    serviceRepo.findByTenantId(tenant.id),
    scheduleRepo.findByTenantId(tenant.id),
  ])
  const activeServices = services.filter((s) => s.active)

  const today = new Date().toISOString().split('T')[0]
  const todayBookings = await bookingRepo.findByTenantAndDate(tenant.id, today)

  const hasServices = activeServices.length > 0
  const hasSchedule = schedule !== null

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Dashboard</h1>

      <SetupChecklist hasServices={hasServices} hasSchedule={hasSchedule} slug={tenant.slug} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 stagger-children">
        <div className="animate-fade-in-up rounded-xl border border-slate-200 border-l-4 border-l-indigo-500 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50">
              <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
            </div>
            <p className="text-sm text-slate-500">Active services</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">{activeServices.length}</p>
        </div>

        <div className="animate-fade-in-up rounded-xl border border-slate-200 border-l-4 border-l-emerald-500 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
              <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
            </div>
            <p className="text-sm text-slate-500">Today&apos;s bookings</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">{todayBookings.length}</p>
        </div>

        <div className="animate-fade-in-up rounded-xl border border-slate-200 border-l-4 border-l-violet-500 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50">
              <svg className="h-5 w-5 text-violet-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </div>
            <p className="text-sm text-slate-500">Public page</p>
          </div>
          <Link
            href={`/${tenant.slug}`}
            target="_blank"
            className="text-indigo-600 hover:text-indigo-700 font-medium break-all transition-colors"
          >
            /{tenant.slug}
          </Link>
        </div>
      </div>
    </div>
  )
}
