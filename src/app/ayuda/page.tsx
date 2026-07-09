import { redirect } from 'next/navigation'
import { detectLocaleFromHeaders } from '@/infrastructure/i18n/detect-locale'

// Redirige a la variante de idioma según Accept-Language. La sección de ayuda
// usa enrutado por idioma propio (/ayuda/es, /ayuda/en) para ser bilingüe.
export default async function AyudaIndex() {
  const locale = await detectLocaleFromHeaders()
  redirect(locale === 'en-US' ? '/ayuda/en' : '/ayuda/es')
}
