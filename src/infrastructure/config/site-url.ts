const DEFAULT_SITE_URL = 'https://reservas-chanantes.vercel.app'

/**
 * URL base pública del sitio, **garantizada válida y absoluta**.
 *
 * Lee `NEXT_PUBLIC_SITE_URL` pero NO confía en su formato: si llega vacía,
 * sin protocolo o malformada, cae al valor por defecto. Un `|| default` no basta
 * —una cadena no vacía pero inválida (p. ej. `"midominio.com"` sin `https://`)
 * es *truthy* y reventaría `new URL()` en `metadataBase` durante el build.
 * Devuelve el `origin` (sin barra final).
 */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (!raw) return DEFAULT_SITE_URL
  try {
    const url = new URL(raw)
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.origin
    }
  } catch {
    // valor malformado → default
  }
  return DEFAULT_SITE_URL
}
