import type { TenantOverview } from './get-platform-overview'

export type EstadoFilter = 'all' | 'active' | 'inactive'

export interface TenantOverviewFilter {
  /** Estado: 'active' | 'inactive' | 'all' (cualquier otro valor → 'all'). */
  estado?: string
  /** Búsqueda libre (case-insensitive) en nombre / slug / ciudad. */
  q?: string
}

/**
 * Filtro puro para la tabla de superadmin. Combina estado (activos/inactivos/
 * todos) y búsqueda de texto en nombre/slug/ciudad. Sin efectos ni BD →
 * testeable directamente.
 */
export function filterTenantOverviews(
  list: TenantOverview[],
  { estado, q }: TenantOverviewFilter
): TenantOverview[] {
  const query = (q ?? '').trim().toLowerCase()

  return list.filter((tenant) => {
    if (estado === 'active' && !tenant.active) return false
    if (estado === 'inactive' && tenant.active) return false

    if (query) {
      const haystack = [tenant.name, tenant.slug, tenant.city ?? '']
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(query)) return false
    }

    return true
  })
}
