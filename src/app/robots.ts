import { getSiteUrl } from '@/infrastructure/config/site-url'
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl()

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/my', '/api'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
