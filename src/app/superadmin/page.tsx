import Link from 'next/link'
import { requireSuperadmin } from '@/infrastructure/auth/superadmin'
import { createSupabaseAdmin } from '@/infrastructure/supabase/admin-client'
import { SupabasePlatformRepository } from '@/infrastructure/supabase/platform-repository'
import { GetPlatformOverviewUseCase } from '@/application/use-cases/get-platform-overview'
import { filterTenantOverviews } from '@/application/use-cases/filter-tenant-overviews'
import { detectLocaleFromHeaders } from '@/infrastructure/i18n/detect-locale'
import { getSuperadminTranslations } from '@/infrastructure/i18n/superadmin-translations'
import { SuperadminRowActions } from './superadmin-row-actions'

export default async function SuperadminPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; q?: string }>
}) {
  // El guard va PRIMERO: nunca se usa service-role antes de validar al operador.
  await requireSuperadmin()

  const locale = await detectLocaleFromHeaders()
  const t = getSuperadminTranslations(locale)
  const params = await searchParams

  const admin = createSupabaseAdmin()
  const data = await new SupabasePlatformRepository(admin).getPlatformData()
  const { perTenant, totals } = new GetPlatformOverviewUseCase().execute(data)

  const rows = filterTenantOverviews(perTenant, {
    estado: params.estado,
    q: params.q,
  }).sort(
    (a, b) =>
      b.volumeOnlineCents +
      b.volumeOnsiteCents -
      (a.volumeOnlineCents + a.volumeOnsiteCents)
  )

  const money = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
  })
  const fmtMoney = (cents: number) => money.format(cents / 100)
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' })
  const fmtDate = (iso: string) => dateFmt.format(new Date(iso))

  const estado = params.estado ?? 'all'

  return (
    <div className="min-h-screen bg-warm-bg p-6 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6">
          <h1 className="font-serif text-2xl font-bold text-slate-900">
            {t.title}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{t.subtitle}</p>
        </header>

        {/* Tarjetas de totales de plataforma */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-[var(--color-warm-border)] border-l-4 border-l-teal-500 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">{t.totals.activeBusinesses}</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">
              {totals.activeCount}
            </p>
            <p className="text-xs text-slate-400">
              {t.totals.ofTotal(totals.tenantCount)}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--color-warm-border)] border-l-4 border-l-emerald-500 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">{t.totals.bookings}</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">
              {totals.totalBookings}
            </p>
            <p className="text-xs text-slate-400">
              {totals.confirmedCount} {t.confirmedShort}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--color-warm-border)] border-l-4 border-l-violet-500 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">{t.totals.volume}</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">
              {fmtMoney(totals.volumeOnlineCents + totals.volumeOnsiteCents)}
            </p>
            <p className="text-xs text-slate-400">
              {t.online} {fmtMoney(totals.volumeOnlineCents)} · {t.onsite}{' '}
              {fmtMoney(totals.volumeOnsiteCents)}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--color-warm-border)] border-l-4 border-l-amber-500 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">{t.totals.commission}</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">
              {fmtMoney(totals.commissionCents)}
            </p>
          </div>
        </div>

        {/* Barra de filtros (form GET: ?estado=&q=) */}
        <form className="mb-6 flex flex-wrap items-end gap-3">
          <div>
            <label
              htmlFor="estado"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              {t.filters.status}
            </label>
            <select
              id="estado"
              name="estado"
              defaultValue={estado}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">{t.filters.all}</option>
              <option value="active">{t.filters.active}</option>
              <option value="inactive">{t.filters.inactive}</option>
            </select>
          </div>
          <div className="flex-1 min-w-[12rem]">
            <label
              htmlFor="q"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              {t.filters.searchPlaceholder}
            </label>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={params.q ?? ''}
              placeholder={t.filters.searchPlaceholder}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-700"
          >
            {t.filters.apply}
          </button>
        </form>

        {/* Tabla de negocios */}
        {rows.length === 0 ? (
          <p className="text-slate-500">{t.emptyState}</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--color-warm-border)] bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-stone-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    {t.columns.business}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    {t.columns.city}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    {t.columns.createdAt}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    {t.columns.bookings}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    {t.columns.customers}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    {t.columns.volume}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    {t.columns.commission}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    {t.columns.stripe}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    {t.columns.status}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    {t.columns.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((tenant) => (
                  <tr
                    key={tenant.id}
                    className="transition-colors hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 text-sm">
                      <Link
                        href={`/${tenant.slug}`}
                        target="_blank"
                        className="font-medium text-teal-600 transition-colors hover:text-teal-700"
                      >
                        {tenant.name}
                      </Link>
                      <span className="block text-xs text-slate-400">
                        /{tenant.slug}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">
                      {tenant.city ?? '-'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">
                      {fmtDate(tenant.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-900">
                      {tenant.totalBookings}
                      <span className="block text-xs text-slate-400">
                        {tenant.confirmedCount} {t.confirmedShort}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-900">
                      {tenant.customersCount}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-900">
                      {fmtMoney(
                        tenant.volumeOnlineCents + tenant.volumeOnsiteCents
                      )}
                      <span className="block text-xs text-slate-400">
                        {t.online} {fmtMoney(tenant.volumeOnlineCents)} ·{' '}
                        {t.onsite} {fmtMoney(tenant.volumeOnsiteCents)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-900">
                      {fmtMoney(tenant.commissionCents)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">
                      {tenant.stripeAccountEnabled ? t.stripe.yes : t.stripe.no}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          tenant.active
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {tenant.active ? t.badge.active : t.badge.inactive}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <SuperadminRowActions
                        tenantId={tenant.id}
                        active={tenant.active}
                        labels={{
                          deactivate: t.actions.deactivate,
                          reactivate: t.actions.reactivate,
                          working: t.actions.working,
                          confirmDeactivate: t.actions.confirmDeactivate,
                          confirmReactivate: t.actions.confirmReactivate,
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
