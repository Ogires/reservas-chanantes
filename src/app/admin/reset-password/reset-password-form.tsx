'use client'

import { useActionState } from 'react'
import { updatePassword } from './actions'
import type { AdminTranslations } from '@/infrastructure/i18n/admin-translations'

interface ResetPasswordFormProps {
  translations: Pick<
    AdminTranslations['auth'],
    'newPassword' | 'confirmPassword' | 'updatePassword' | 'updatingPassword'
  >
}

export function ResetPasswordForm({ translations: t }: ResetPasswordFormProps) {
  const [state, formAction, isPending] = useActionState(updatePassword, null)

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-600">
          {state.error}
        </div>
      )}

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-slate-700 mb-1.5"
        >
          {t.newPassword}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
        />
      </div>

      <div>
        <label
          htmlFor="confirm"
          className="block text-sm font-medium text-slate-700 mb-1.5"
        >
          {t.confirmPassword}
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          minLength={6}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-teal-600 px-4 py-2.5 font-medium text-white shadow-sm hover:bg-teal-700 disabled:opacity-50 transition-colors"
      >
        {isPending ? t.updatingPassword : t.updatePassword}
      </button>
    </form>
  )
}
