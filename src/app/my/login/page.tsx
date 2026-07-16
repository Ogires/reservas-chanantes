import Link from 'next/link'
import { CustomerLoginForm } from './login-form'
import { CustomerGoogleSignInButton } from './google-sign-in-button'
import { detectLocaleFromHeaders } from '@/infrastructure/i18n/detect-locale'
import { getPortalTranslations } from '@/infrastructure/i18n/portal-translations'

export default async function CustomerLoginPage() {
  const t = getPortalTranslations(await detectLocaleFromHeaders())

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link href="/" className="text-lg font-bold font-serif text-slate-900 hover:text-teal-700 transition-colors">Reservas Chanantes</Link>
          <p className="text-sm text-slate-500 mt-1">{t.yourPortal}</p>
        </div>
        <div className="rounded-2xl border border-[var(--color-warm-border)] bg-white p-8 shadow-lg">
          <h1 className="text-2xl font-bold font-serif text-center text-slate-900 mb-6">
            {t.signInToPortal}
          </h1>
          <CustomerGoogleSignInButton label={t.continueWithGoogle} />
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--color-warm-border)]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-slate-400">{t.or}</span>
            </div>
          </div>
          <CustomerLoginForm t={t} />
        </div>
      </div>
    </div>
  )
}
