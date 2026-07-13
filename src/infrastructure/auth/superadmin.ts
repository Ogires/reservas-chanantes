/**
 * Helper puro y fail-closed: ¿es `email` uno de los operadores de plataforma?
 * Normaliza (trim + minúsculas) y filtra entradas vacías. Si no hay email o la
 * allowlist está ausente/vacía → `false` (nadie es superadmin por defecto).
 */
export function isSuperadmin(
  email: string | null | undefined,
  allowlist: string | undefined
): boolean {
  if (!email || !allowlist) return false
  const set = new Set(
    allowlist
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  )
  return set.has(email.trim().toLowerCase())
}

/**
 * Guard de servidor para rutas/acciones de superadmin. Obtiene el usuario de la
 * sesión; si no está en la allowlist (`SUPERADMIN_EMAILS`) responde `notFound()`
 * (404, no revela que la ruta existe). Debe ejecutarse ANTES de usar service-role.
 *
 * Las dependencias de servidor (`next/navigation`, Supabase, `env` con
 * `server-only`) se importan de forma perezosa dentro de la función para que el
 * helper puro `isSuperadmin` siga siendo importable en tests de entorno Node.
 */
export async function requireSuperadmin() {
  const { notFound } = await import('next/navigation')
  const { createSupabaseServer } = await import(
    '@/infrastructure/supabase/server'
  )
  const { env } = await import('@/infrastructure/config/env')

  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!isSuperadmin(user?.email, env.SUPERADMIN_EMAILS)) notFound()
  return { user, supabase }
}
