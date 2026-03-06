import type { MetadataRoute } from 'next'
import { createServerClient } from '@supabase/ssr'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://reservas-chanantes.vercel.app'

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [] } },
  )

  const { data: tenants } = await supabase
    .from('tenants')
    .select('slug, created_at')

  const tenantUrls: MetadataRoute.Sitemap = (tenants ?? []).map((t) => ({
    url: `${baseUrl}/${t.slug}`,
    lastModified: t.created_at ?? new Date().toISOString(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date().toISOString(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    ...tenantUrls,
  ]
}
