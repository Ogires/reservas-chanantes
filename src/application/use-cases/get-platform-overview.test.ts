import { describe, it, expect } from 'vitest'
import { GetPlatformOverviewUseCase } from './get-platform-overview'
import type {
  BookingStatsRow,
  TenantStatsRow,
} from '@/infrastructure/supabase/platform-repository'

function tenant(overrides: Partial<TenantStatsRow> & { id: string }): TenantStatsRow {
  return {
    name: `Negocio ${overrides.id}`,
    slug: `negocio-${overrides.id}`,
    city: 'Madrid',
    created_at: '2026-01-01T00:00:00Z',
    active: true,
    stripe_account_enabled: false,
    plan: 'FREE',
    ...overrides,
  }
}

function booking(overrides: Partial<BookingStatsRow> & { tenant_id: string }): BookingStatsRow {
  return {
    status: 'CONFIRMED',
    payment_method: 'ONLINE',
    customer_id: 'c-1',
    service: { price_cents: 1000 },
    ...overrides,
  }
}

describe('GetPlatformOverviewUseCase', () => {
  it('aggregates bookings by tenant: status counts, distinct customers, split volume and commission', () => {
    const tenants: TenantStatsRow[] = [
      tenant({ id: 't-1', plan: 'FREE', active: true }),
      tenant({ id: 't-2', plan: 'PRO', active: false }),
      tenant({ id: 't-3', plan: 'FREE', active: true }), // sin reservas
    ]
    const bookings: BookingStatsRow[] = [
      // t-1
      booking({ tenant_id: 't-1', status: 'CONFIRMED', payment_method: 'ONLINE', customer_id: 'c-1', service: { price_cents: 1000 } }),
      booking({ tenant_id: 't-1', status: 'CONFIRMED', payment_method: 'ONLINE', customer_id: 'c-2', service: { price_cents: 2000 } }),
      booking({ tenant_id: 't-1', status: 'CONFIRMED', payment_method: 'ON_SITE', customer_id: 'c-1', service: { price_cents: 5000 } }),
      booking({ tenant_id: 't-1', status: 'PENDING', payment_method: 'ONLINE', customer_id: 'c-3', service: { price_cents: 999 } }),
      booking({ tenant_id: 't-1', status: 'CANCELLED', payment_method: 'ONLINE', customer_id: 'c-1', service: { price_cents: 999 } }),
      // t-2
      booking({ tenant_id: 't-2', status: 'CONFIRMED', payment_method: 'ONLINE', customer_id: 'c-9', service: { price_cents: 10000 } }),
    ]

    const { perTenant, totals } = new GetPlatformOverviewUseCase().execute({
      tenants,
      bookings,
    })

    const t1 = perTenant.find((t) => t.id === 't-1')!
    expect(t1.pendingCount).toBe(1)
    expect(t1.confirmedCount).toBe(3)
    expect(t1.cancelledCount).toBe(1)
    expect(t1.totalBookings).toBe(5)
    expect(t1.customersCount).toBe(3) // c-1, c-2, c-3 distintos
    expect(t1.volumeOnlineCents).toBe(3000) // 1000 + 2000 (solo CONFIRMED online)
    expect(t1.volumeOnsiteCents).toBe(5000) // 5000 CONFIRMED presencial
    // FREE = 5% (500 bps) sobre el volumen ONLINE confirmado: round(3000*0.05)=150
    expect(t1.commissionCents).toBe(150)

    const t2 = perTenant.find((t) => t.id === 't-2')!
    expect(t2.plan).toBe('PRO')
    expect(t2.volumeOnlineCents).toBe(10000)
    // PRO = 1% (100 bps): round(10000*0.01)=100
    expect(t2.commissionCents).toBe(100)

    // Totales de plataforma = sumas + activeCount
    expect(totals.tenantCount).toBe(3)
    expect(totals.activeCount).toBe(2) // t-1 y t-3
    expect(totals.totalBookings).toBe(6)
    expect(totals.pendingCount).toBe(1)
    expect(totals.confirmedCount).toBe(4)
    expect(totals.cancelledCount).toBe(1)
    expect(totals.customersCount).toBe(4) // 3 + 1 + 0
    expect(totals.volumeOnlineCents).toBe(13000)
    expect(totals.volumeOnsiteCents).toBe(5000)
    expect(totals.commissionCents).toBe(250)
  })

  it('keeps a tenant with no bookings with all metrics at zero (does not drop it)', () => {
    const tenants: TenantStatsRow[] = [tenant({ id: 't-empty' })]

    const { perTenant } = new GetPlatformOverviewUseCase().execute({
      tenants,
      bookings: [],
    })

    expect(perTenant).toHaveLength(1)
    const t = perTenant[0]
    expect(t.id).toBe('t-empty')
    expect(t.totalBookings).toBe(0)
    expect(t.pendingCount).toBe(0)
    expect(t.confirmedCount).toBe(0)
    expect(t.cancelledCount).toBe(0)
    expect(t.customersCount).toBe(0)
    expect(t.volumeOnlineCents).toBe(0)
    expect(t.volumeOnsiteCents).toBe(0)
    expect(t.commissionCents).toBe(0)
  })

  it('commissions ONLY the online confirmed volume (presencial does not commission)', () => {
    const tenants: TenantStatsRow[] = [tenant({ id: 't-1', plan: 'FREE' })]
    const bookings: BookingStatsRow[] = [
      booking({ tenant_id: 't-1', status: 'CONFIRMED', payment_method: 'ON_SITE', service: { price_cents: 100000 } }),
    ]

    const { perTenant } = new GetPlatformOverviewUseCase().execute({
      tenants,
      bookings,
    })

    expect(perTenant[0].volumeOnsiteCents).toBe(100000)
    expect(perTenant[0].volumeOnlineCents).toBe(0)
    expect(perTenant[0].commissionCents).toBe(0) // presencial no comisiona
  })

  it('rounds the commission to the nearest cent', () => {
    const tenants: TenantStatsRow[] = [tenant({ id: 't-1', plan: 'FREE' })]
    const bookings: BookingStatsRow[] = [
      // 2510 * 5% = 125.5 → round → 126
      booking({ tenant_id: 't-1', status: 'CONFIRMED', payment_method: 'ONLINE', service: { price_cents: 2510 } }),
    ]

    const { perTenant } = new GetPlatformOverviewUseCase().execute({
      tenants,
      bookings,
    })

    expect(perTenant[0].commissionCents).toBe(126)
  })

  it('treats a null payment_method as ONLINE for confirmed volume', () => {
    const tenants: TenantStatsRow[] = [tenant({ id: 't-1', plan: 'FREE' })]
    const bookings: BookingStatsRow[] = [
      booking({ tenant_id: 't-1', status: 'CONFIRMED', payment_method: null, service: { price_cents: 4000 } }),
    ]

    const { perTenant } = new GetPlatformOverviewUseCase().execute({
      tenants,
      bookings,
    })

    expect(perTenant[0].volumeOnlineCents).toBe(4000)
    expect(perTenant[0].volumeOnsiteCents).toBe(0)
  })

  it('reads price_cents when the service embed comes back as an array', () => {
    const tenants: TenantStatsRow[] = [tenant({ id: 't-1', plan: 'FREE' })]
    const bookings: BookingStatsRow[] = [
      booking({ tenant_id: 't-1', status: 'CONFIRMED', payment_method: 'ONLINE', service: [{ price_cents: 3333 }] }),
    ]

    const { perTenant } = new GetPlatformOverviewUseCase().execute({
      tenants,
      bookings,
    })

    expect(perTenant[0].volumeOnlineCents).toBe(3333)
  })

  it('counts a booking with a missing service (null) as zero volume', () => {
    const tenants: TenantStatsRow[] = [tenant({ id: 't-1', plan: 'FREE' })]
    const bookings: BookingStatsRow[] = [
      booking({ tenant_id: 't-1', status: 'CONFIRMED', payment_method: 'ONLINE', service: null }),
    ]

    const { perTenant } = new GetPlatformOverviewUseCase().execute({
      tenants,
      bookings,
    })

    expect(perTenant[0].confirmedCount).toBe(1)
    expect(perTenant[0].volumeOnlineCents).toBe(0)
    expect(perTenant[0].commissionCents).toBe(0)
  })

  it('ignores bookings whose tenant is not in the tenants list (orphans)', () => {
    const tenants: TenantStatsRow[] = [tenant({ id: 't-1' })]
    const bookings: BookingStatsRow[] = [
      booking({ tenant_id: 'ghost', status: 'CONFIRMED', service: { price_cents: 9999 } }),
    ]

    const { perTenant, totals } = new GetPlatformOverviewUseCase().execute({
      tenants,
      bookings,
    })

    expect(perTenant).toHaveLength(1)
    expect(perTenant[0].totalBookings).toBe(0)
    expect(totals.totalBookings).toBe(0)
    expect(totals.volumeOnlineCents).toBe(0)
  })

  it('normalizes an unknown/null plan to FREE for commission', () => {
    const tenants: TenantStatsRow[] = [
      tenant({ id: 't-1', plan: null }),
      tenant({ id: 't-2', plan: 'WEIRD' }),
    ]
    const bookings: BookingStatsRow[] = [
      booking({ tenant_id: 't-1', status: 'CONFIRMED', payment_method: 'ONLINE', service: { price_cents: 1000 } }),
      booking({ tenant_id: 't-2', status: 'CONFIRMED', payment_method: 'ONLINE', service: { price_cents: 1000 } }),
    ]

    const { perTenant } = new GetPlatformOverviewUseCase().execute({
      tenants,
      bookings,
    })

    // Ambos como FREE (5%): round(1000*0.05)=50
    expect(perTenant.find((t) => t.id === 't-1')!.plan).toBe('FREE')
    expect(perTenant.find((t) => t.id === 't-1')!.commissionCents).toBe(50)
    expect(perTenant.find((t) => t.id === 't-2')!.plan).toBe('FREE')
    expect(perTenant.find((t) => t.id === 't-2')!.commissionCents).toBe(50)
  })

  it('maps tenant metadata (active defaults to true when null) into the overview', () => {
    const tenants: TenantStatsRow[] = [
      tenant({ id: 't-1', name: 'Bar Pepe', slug: 'bar-pepe', city: 'Cádiz', active: null, stripe_account_enabled: true }),
    ]

    const { perTenant, totals } = new GetPlatformOverviewUseCase().execute({
      tenants,
      bookings: [],
    })

    const t = perTenant[0]
    expect(t.name).toBe('Bar Pepe')
    expect(t.slug).toBe('bar-pepe')
    expect(t.city).toBe('Cádiz')
    expect(t.active).toBe(true) // null → true (code-first)
    expect(t.stripeAccountEnabled).toBe(true)
    expect(totals.activeCount).toBe(1)
  })
})
