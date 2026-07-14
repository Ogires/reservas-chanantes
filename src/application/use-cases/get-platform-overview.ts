import { TenantPlan } from '@/domain/types'
import { getCommissionRateBps } from '@/domain/services/plan-limits'
import type {
  BookingStatsRow,
  TenantStatsRow,
} from '@/infrastructure/supabase/platform-repository'

/** Métricas agregadas de un negocio para el panel de plataforma. */
export interface TenantOverview {
  id: string
  name: string
  slug: string
  city: string | null
  createdAt: string
  active: boolean
  stripeAccountEnabled: boolean
  plan: TenantPlan
  pendingCount: number
  confirmedCount: number
  cancelledCount: number
  totalBookings: number
  /** Nº de `customer_id` distintos con reserva en el negocio. */
  customersCount: number
  /** Σ price_cents de reservas CONFIRMED pagadas online. */
  volumeOnlineCents: number
  /** Σ price_cents de reservas CONFIRMED pagadas presencialmente. */
  volumeOnsiteCents: number
  /** Comisión de plataforma: tarifa del plan × volumen online (presencial no comisiona). */
  commissionCents: number
}

/** Totales de plataforma = suma de las métricas por negocio + recuento de activos. */
export interface PlatformTotals {
  tenantCount: number
  activeCount: number
  totalBookings: number
  pendingCount: number
  confirmedCount: number
  cancelledCount: number
  customersCount: number
  volumeOnlineCents: number
  volumeOnsiteCents: number
  commissionCents: number
}

export interface PlatformOverview {
  perTenant: TenantOverview[]
  totals: PlatformTotals
}

export interface PlatformData {
  tenants: TenantStatsRow[]
  bookings: BookingStatsRow[]
}

/** El `active` ausente/`null` se trata como `true` (code-first, coherente con el mapeo de dominio). */
function isActive(row: TenantStatsRow): boolean {
  return row.active ?? true
}

/** Normaliza el plan crudo a un `TenantPlan` conocido (null/desconocido → FREE). */
function normalizePlan(plan: string | null): TenantPlan {
  return plan === TenantPlan.PRO ? TenantPlan.PRO : TenantPlan.FREE
}

/** Extrae `price_cents` del embed `service`, que puede llegar como objeto, array o null. */
function priceCentsOf(row: BookingStatsRow): number {
  const service = row.service
  if (!service) return 0
  const obj = Array.isArray(service) ? service[0] : service
  return obj?.price_cents ?? 0
}

interface Accumulator {
  overview: TenantOverview
  customers: Set<string>
}

/**
 * Agrega los datos crudos cross-tenant en métricas por negocio + totales de
 * plataforma. Lógica de negocio pura (sin BD) → testeable con mocks.
 */
export class GetPlatformOverviewUseCase {
  execute({ tenants, bookings }: PlatformData): PlatformOverview {
    const accumulators = new Map<string, Accumulator>()

    for (const row of tenants) {
      accumulators.set(row.id, {
        overview: {
          id: row.id,
          name: row.name,
          slug: row.slug,
          city: row.city,
          createdAt: row.created_at,
          active: isActive(row),
          stripeAccountEnabled: row.stripe_account_enabled ?? false,
          plan: normalizePlan(row.plan),
          pendingCount: 0,
          confirmedCount: 0,
          cancelledCount: 0,
          totalBookings: 0,
          customersCount: 0,
          volumeOnlineCents: 0,
          volumeOnsiteCents: 0,
          commissionCents: 0,
        },
        customers: new Set<string>(),
      })
    }

    for (const booking of bookings) {
      const acc = accumulators.get(booking.tenant_id)
      // Reserva huérfana (tenant fuera de la lista): se ignora.
      if (!acc) continue

      const { overview, customers } = acc
      overview.totalBookings += 1
      customers.add(booking.customer_id)

      switch (booking.status) {
        case 'PENDING':
          overview.pendingCount += 1
          break
        case 'CONFIRMED':
          overview.confirmedCount += 1
          break
        case 'CANCELLED':
          overview.cancelledCount += 1
          break
      }

      if (booking.status === 'CONFIRMED') {
        const price = priceCentsOf(booking)
        // payment_method ausente se trata como ONLINE (coherente con la reserva).
        if (booking.payment_method === 'ON_SITE') {
          overview.volumeOnsiteCents += price
        } else {
          overview.volumeOnlineCents += price
        }
      }
    }

    const perTenant: TenantOverview[] = []
    for (const { overview, customers } of accumulators.values()) {
      overview.customersCount = customers.size
      const rateBps = getCommissionRateBps(overview.plan)
      overview.commissionCents = Math.round(
        (overview.volumeOnlineCents * rateBps) / 10000
      )
      perTenant.push(overview)
    }

    const totals: PlatformTotals = {
      tenantCount: perTenant.length,
      activeCount: perTenant.filter((t) => t.active).length,
      totalBookings: sum(perTenant, (t) => t.totalBookings),
      pendingCount: sum(perTenant, (t) => t.pendingCount),
      confirmedCount: sum(perTenant, (t) => t.confirmedCount),
      cancelledCount: sum(perTenant, (t) => t.cancelledCount),
      customersCount: sum(perTenant, (t) => t.customersCount),
      volumeOnlineCents: sum(perTenant, (t) => t.volumeOnlineCents),
      volumeOnsiteCents: sum(perTenant, (t) => t.volumeOnsiteCents),
      commissionCents: sum(perTenant, (t) => t.commissionCents),
    }

    return { perTenant, totals }
  }
}

function sum(list: TenantOverview[], pick: (t: TenantOverview) => number): number {
  return list.reduce((acc, t) => acc + pick(t), 0)
}
