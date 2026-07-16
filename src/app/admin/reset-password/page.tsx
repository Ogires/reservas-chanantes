import Link from 'next/link'
import { ResetPasswordForm } from './reset-password-form'
import { detectLocaleFromHeaders } from '@/infrastructure/i18n/detect-locale'
import { getAdminTranslations } from '@/infrastructure/i18n/admin-translations'

export default async function ResetPasswordPage() {
  const locale = await detectLocaleFromHeaders()
  const t = getAdminTranslations(locale)

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#FDFBF9] to-[#F5F0EB] px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link href="/" className="text-lg font-bold font-serif text-slate-900 hover:text-teal-700 transition-colors">
            Reservas Chanantes
          </Link>
        </div>
        <div className="rounded-2xl border border-warm-border bg-white p-8 shadow-lg">
          <h1 className="text-2xl font-bold text-center text-slate-900 mb-6">
            {t.auth.resetPasswordTitle}
          </h1>
          <ResetPasswordForm
            translations={{
              newPassword: t.auth.newPassword,
              confirmPassword: t.auth.confirmPassword,
              updatePassword: t.auth.updatePassword,
              updatingPassword: t.auth.updatingPassword,
              passwordWeak: t.auth.passwordWeak,
            }}
          />
        </div>
        <p className="text-center text-sm text-slate-500">
          <Link href="/admin/login" className="text-teal-600 hover:text-teal-700 font-medium transition-colors">
            {t.auth.signIn}
          </Link>
        </p>
      </div>
    </div>
  )
}
