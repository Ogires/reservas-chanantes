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
          <p className="text-lg font-bold font-serif text-slate-900">
            Reservas Chanantes
          </p>
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
            }}
          />
        </div>
      </div>
    </div>
  )
}
