import type { SupabaseClient } from '@supabase/supabase-js'

/** Fila cruda de `tenants` para el panel de plataforma (sin mapear a dominio). */
export interface TenantStatsRow {
  id: string
  name: string
  slug: string
  city: string | null
  created_at: string
  active: boolean | null
  stripe_account_enabled: boolean | null
  // La monetización no está persistida (no hay columna `plan` en la BD): todos
  // los tenants resuelven a FREE. Se mantiene opcional por si se añade el plan.
  plan?: string | null
}

/**
 * Fila cruda de `bookings` para agregar métricas de plataforma.
 * `service` es el embed a `services(price_cents)`: PostgREST lo devuelve como
 * objeto (relación muchos-a-uno) pero se contempla también forma de array por
 * robustez frente a variaciones del cliente.
 */
export interface BookingStatsRow {
  tenant_id: string
  status: string
  payment_method: string | null
  customer_id: string
  service:
    | { price_cents: number }
    | { price_cents: number }[]
    | null
}

/** Tamaño de página de PostgREST (tope por defecto: 1000 filas). */
const PAGE_SIZE = 1000

/**
 * Lectura cross-tenant para el dashboard de superadmin. Recibe un cliente con
 * service-role (salta RLS) — usarlo SOLO tras `requireSuperadmin()`.
 *
 * Devuelve filas crudas; la agregación vive en `GetPlatformOverviewUseCase`
 * (capa aplicación) para que la lógica de negocio sea testeable con mocks.
 */
export class SupabasePlatformRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async getPlatformData(): Promise<{
    tenants: TenantStatsRow[]
    bookings: BookingStatsRow[]
  }> {
    const { data: tenantsData, error: tenantsError } = await this.supabase
      .from('tenants')
      .select('id,name,slug,city,created_at,active,stripe_account_enabled')

    if (tenantsError) {
      throw new Error(`Failed to fetch tenants: ${tenantsError.message}`)
    }

    // Paginación en bucle con `.range()`: PostgREST tope a 1000 filas por
    // petición. Se pide página a página hasta recibir menos de PAGE_SIZE, para
    // NO truncar la lectura cross-tenant en negocios con muchas reservas.
    const bookings: BookingStatsRow[] = []
    let from = 0
    for (;;) {
      const { data, error } = await this.supabase
        .from('bookings')
        .select('tenant_id,status,payment_method,customer_id,service:services(price_cents)')
        // Orden determinista por clave primaria: la paginación por offset de
        // PostgREST necesita un `ORDER BY` estable, o filas en el límite de
        // página podrían saltarse o duplicarse entre peticiones.
        .order('id', { ascending: true })
        .range(from, from + PAGE_SIZE - 1)

      if (error) {
        throw new Error(`Failed to fetch bookings: ${error.message}`)
      }

      const page = (data ?? []) as unknown as BookingStatsRow[]
      bookings.push(...page)

      if (page.length < PAGE_SIZE) break
      from += PAGE_SIZE
    }

    return {
      tenants: (tenantsData ?? []) as unknown as TenantStatsRow[],
      bookings,
    }
  }

  /**
   * Activa/desactiva un negocio (flag `active`). Requiere service-role: la
   * migración instala un trigger que solo permite este cambio al operador de
   * plataforma. Usar SOLO tras `requireSuperadmin()`.
   */
  async setTenantActive(tenantId: string, active: boolean): Promise<void> {
    const { error } = await this.supabase
      .from('tenants')
      .update({ active })
      .eq('id', tenantId)

    if (error) {
      throw new Error(`Failed to set tenant active: ${error.message}`)
    }
  }
}
