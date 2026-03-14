import { headers } from 'next/headers'
import type { Locale } from '@/domain/types'

const DEFAULT_LOCALE: Locale = 'es-ES'

export async function detectLocaleFromHeaders(): Promise<Locale> {
  const headersList = await headers()
  const acceptLang = headersList.get('accept-language') ?? ''
  if (acceptLang.toLowerCase().startsWith('en')) return 'en-US'
  return DEFAULT_LOCALE
}
