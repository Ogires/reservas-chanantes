import { describe, it, expect } from 'vitest'
import { filterTenantOverviews } from './filter-tenant-overviews'
import type { TenantOverview } from './get-platform-overview'

function overview(
  overrides: Partial<TenantOverview> & { id: string }
): TenantOverview {
  return {
    name: `Negocio ${overrides.id}`,
    slug: `negocio-${overrides.id}`,
    city: 'Madrid',
    createdAt: '2026-01-01T00:00:00Z',
    active: true,
    stripeAccountEnabled: false,
    plan: 'FREE' as TenantOverview['plan'],
    pendingCount: 0,
    confirmedCount: 0,
    cancelledCount: 0,
    totalBookings: 0,
    customersCount: 0,
    volumeOnlineCents: 0,
    volumeOnsiteCents: 0,
    commissionCents: 0,
    ...overrides,
  }
}

const LIST: TenantOverview[] = [
  overview({ id: '1', name: 'Peluquería Juan', slug: 'peluqueria-juan', city: 'Madrid', active: true }),
  overview({ id: '2', name: 'Bar Pepe', slug: 'bar-pepe', city: 'Cádiz', active: false }),
  overview({ id: '3', name: 'Clínica Dental', slug: 'clinica-dental', city: 'Sevilla', active: true }),
]

describe('filterTenantOverviews', () => {
  it('returns the full list with estado "all" and empty q', () => {
    expect(filterTenantOverviews(LIST, { estado: 'all', q: '' })).toHaveLength(3)
  })

  it('returns the full list when no filter is given', () => {
    expect(filterTenantOverviews(LIST, {})).toHaveLength(3)
  })

  it('keeps only active tenants with estado "active"', () => {
    const result = filterTenantOverviews(LIST, { estado: 'active' })
    expect(result.map((t) => t.id)).toEqual(['1', '3'])
  })

  it('keeps only inactive tenants with estado "inactive"', () => {
    const result = filterTenantOverviews(LIST, { estado: 'inactive' })
    expect(result.map((t) => t.id)).toEqual(['2'])
  })

  it('treats an unknown estado value as "all"', () => {
    expect(filterTenantOverviews(LIST, { estado: 'garbage' })).toHaveLength(3)
  })

  it('matches q case-insensitively against name', () => {
    const result = filterTenantOverviews(LIST, { q: 'JUAN' })
    expect(result.map((t) => t.id)).toEqual(['1'])
  })

  it('matches q against slug', () => {
    const result = filterTenantOverviews(LIST, { q: 'bar-pepe' })
    expect(result.map((t) => t.id)).toEqual(['2'])
  })

  it('matches q against city', () => {
    const result = filterTenantOverviews(LIST, { q: 'sevilla' })
    expect(result.map((t) => t.id)).toEqual(['3'])
  })

  it('trims surrounding whitespace in q', () => {
    const result = filterTenantOverviews(LIST, { q: '  pepe  ' })
    expect(result.map((t) => t.id)).toEqual(['2'])
  })

  it('does not crash when city is null', () => {
    const list = [overview({ id: '9', name: 'Sin Ciudad', city: null })]
    expect(filterTenantOverviews(list, { q: 'sin' })).toHaveLength(1)
    expect(filterTenantOverviews(list, { q: 'madrid' })).toHaveLength(0)
  })

  it('combines estado and q filters', () => {
    // "a" aparece en varios; con estado inactive solo debe quedar Bar Pepe (Cádiz).
    const result = filterTenantOverviews(LIST, { estado: 'inactive', q: 'a' })
    expect(result.map((t) => t.id)).toEqual(['2'])
  })

  it('returns an empty list when nothing matches', () => {
    expect(filterTenantOverviews(LIST, { q: 'zzz' })).toHaveLength(0)
  })
})
