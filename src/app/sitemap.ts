import { getSiteUrl } from '@/infrastructure/config/site-url'
import type { MetadataRoute } from 'next'
import { createServerClient } from '@supabase/ssr'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl()

  const base: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date().toISOString(),
      changeFrequency: 'monthly',
      priority: 1,
    },
  ]

  // Degradación elegante: si Supabase no está disponible (p. ej. en el build de
  // CI sin variables de entorno) devolvemos solo la URL base en vez de fallar.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) return base

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: { getAll: () => [] },
    })

    const { data: tenants } = await supabase
      .from('tenants')
      .select('slug, created_at')

    const tenantUrls: MetadataRoute.Sitemap = (tenants ?? []).map((t) => ({
      url: `${baseUrl}/${t.slug}`,
      lastModified: t.created_at ?? new Date().toISOString(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }))

    return [...base, ...tenantUrls]
  } catch {
    return base
  }
}
