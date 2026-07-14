import type { Locale } from '@/domain/types'

/**
 * Diccionario del panel de superadmin (operador de plataforma). Sigue el mismo
 * patrón que `admin-translations.ts`: una interfaz tipada + un diccionario por
 * `Locale` + un getter. Las cadenas con parámetro son funciones y solo se
 * consumen en el server component (no cruzan la frontera a cliente).
 */
export interface SuperadminTranslations {
  title: string
  subtitle: string
  totals: {
    activeBusinesses: string
    ofTotal: (total: number) => string
    bookings: string
    volume: string
    commission: string
  }
  columns: {
    business: string
    city: string
    createdAt: string
    bookings: string
    customers: string
    volume: string
    commission: string
    stripe: string
    status: string
    actions: string
  }
  filters: {
    status: string
    all: string
    active: string
    inactive: string
    searchPlaceholder: string
    apply: string
  }
  badge: {
    active: string
    inactive: string
  }
  stripe: {
    yes: string
    no: string
  }
  actions: {
    deactivate: string
    reactivate: string
    working: string
    confirmDeactivate: string
    confirmReactivate: string
  }
  confirmedShort: string
  online: string
  onsite: string
  emptyState: string
}

const es: SuperadminTranslations = {
  title: 'Panel de plataforma',
  subtitle: 'Gestion de negocios-cliente: metricas, estado y activacion.',
  totals: {
    activeBusinesses: 'Negocios activos',
    ofTotal: (total) => `de ${total} en total`,
    bookings: 'Reservas totales',
    volume: 'Volumen confirmado',
    commission: 'Comision de plataforma',
  },
  columns: {
    business: 'Negocio',
    city: 'Ciudad',
    createdAt: 'Alta',
    bookings: 'Reservas',
    customers: 'Clientes',
    volume: 'Volumen',
    commission: 'Comision',
    stripe: 'Stripe',
    status: 'Estado',
    actions: 'Accion',
  },
  filters: {
    status: 'Estado',
    all: 'Todos',
    active: 'Activos',
    inactive: 'Inactivos',
    searchPlaceholder: 'Buscar por nombre, slug o ciudad',
    apply: 'Filtrar',
  },
  badge: {
    active: 'Activo',
    inactive: 'Inactivo',
  },
  stripe: {
    yes: 'Si',
    no: 'No',
  },
  actions: {
    deactivate: 'Desactivar',
    reactivate: 'Reactivar',
    working: 'Procesando...',
    confirmDeactivate: '¿Desactivar este negocio? Sus reservas publicas quedaran bloqueadas.',
    confirmReactivate: '¿Reactivar este negocio? Volvera a aceptar reservas publicas.',
  },
  confirmedShort: 'confirmadas',
  online: 'Online',
  onsite: 'Presencial',
  emptyState: 'No hay negocios que coincidan con el filtro.',
}

const en: SuperadminTranslations = {
  title: 'Platform dashboard',
  subtitle: 'Client business management: metrics, status and activation.',
  totals: {
    activeBusinesses: 'Active businesses',
    ofTotal: (total) => `of ${total} total`,
    bookings: 'Total bookings',
    volume: 'Confirmed volume',
    commission: 'Platform commission',
  },
  columns: {
    business: 'Business',
    city: 'City',
    createdAt: 'Joined',
    bookings: 'Bookings',
    customers: 'Customers',
    volume: 'Volume',
    commission: 'Commission',
    stripe: 'Stripe',
    status: 'Status',
    actions: 'Action',
  },
  filters: {
    status: 'Status',
    all: 'All',
    active: 'Active',
    inactive: 'Inactive',
    searchPlaceholder: 'Search by name, slug or city',
    apply: 'Filter',
  },
  badge: {
    active: 'Active',
    inactive: 'Inactive',
  },
  stripe: {
    yes: 'Yes',
    no: 'No',
  },
  actions: {
    deactivate: 'Deactivate',
    reactivate: 'Reactivate',
    working: 'Working...',
    confirmDeactivate: 'Deactivate this business? Its public bookings will be blocked.',
    confirmReactivate: 'Reactivate this business? It will accept public bookings again.',
  },
  confirmedShort: 'confirmed',
  online: 'Online',
  onsite: 'On-site',
  emptyState: 'No businesses match the filter.',
}

const translations: Record<Locale, SuperadminTranslations> = {
  'es-ES': es,
  'en-US': en,
}

export function getSuperadminTranslations(locale: Locale): SuperadminTranslations {
  return translations[locale]
}
