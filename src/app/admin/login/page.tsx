import Link from 'next/link'
import { LoginForm } from './login-form'
import { GoogleSignInButton } from '../_components/google-sign-in-button'
import { detectLocaleFromHeaders } from '@/infrastructure/i18n/detect-locale'
import { getAdminTranslations } from '@/infrastructure/i18n/admin-translations'

export default async function LoginPage() {
  const locale = await detectLocaleFromHeaders()
  const t = getAdminTranslations(locale)

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#FDFBF9] to-[#F5F0EB] px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <p className="text-lg font-bold font-serif text-slate-900">Reservas Chanantes</p>
        </div>
        <div className="rounded-2xl border border-warm-border bg-white p-8 shadow-lg">
          <h1 className="text-2xl font-bold text-center text-slate-900 mb-6">{t.auth.signIn}</h1>
          <GoogleSignInButton label={t.auth.continueWithGoogle} />
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-warm-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-slate-400">{t.common.or}</span>
            </div>
          </div>
          <LoginForm translations={t.auth} />
        </div>
        <p className="text-center text-sm text-slate-500">
          {t.auth.noAccount}{' '}
          <Link href="/admin/register" className="text-teal-600 hover:text-teal-700 font-medium transition-colors">
            {t.auth.createAccount}
          </Link>
        </p>
      </div>
    </div>
  )
}
