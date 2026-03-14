'use client'

import { useActionState } from 'react'
import { register } from './actions'
import type { AdminTranslations } from '@/infrastructure/i18n/admin-translations'

interface RegisterFormProps {
  isOAuthUser?: boolean
  translations: AdminTranslations['auth']
}

export function RegisterForm({ isOAuthUser, translations: t }: RegisterFormProps) {
  const [state, formAction, isPending] = useActionState(register, null)

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-600">
          {state.error}
        </div>
      )}

      {isOAuthUser && <input type="hidden" name="isOAuthUser" value="true" />}

      <div>
        <label
          htmlFor="businessName"
          className="block text-sm font-medium text-slate-700 mb-1.5"
        >
          {t.businessName}
        </label>
        <input
          id="businessName"
          name="businessName"
          type="text"
          required
          placeholder={t.businessNamePlaceholder}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
        />
      </div>

      {!isOAuthUser && (
        <>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
              {t.email}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
              {t.password}
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
        </>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-teal-600 px-4 py-2.5 font-medium text-white shadow-sm hover:bg-teal-700 disabled:opacity-50 transition-colors"
      >
        {isPending
          ? (isOAuthUser ? t.configuringPage : t.creatingAccount)
          : (isOAuthUser ? t.createMyPage : t.createAccount)
        }
      </button>
    </form>
  )
}
