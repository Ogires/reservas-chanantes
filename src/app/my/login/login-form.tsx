'use client'

import { useActionState, useState } from 'react'
import { customerLogin, customerRegister } from './actions'
import type { PortalTranslations } from '@/infrastructure/i18n/portal-translations'

export function CustomerLoginForm({ t }: { t: PortalTranslations }) {
  const [isRegister, setIsRegister] = useState(false)
  const [loginState, loginAction, isLoggingIn] = useActionState(customerLogin, null)
  const [registerState, registerAction, isRegistering] = useActionState(customerRegister, null)

  const state = isRegister ? registerState : loginState
  const action = isRegister ? registerAction : loginAction
  const isPending = isRegister ? isRegistering : isLoggingIn

  if (isRegister && registerState && 'needsConfirmation' in registerState) {
    return (
      <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 space-y-1">
        <p className="font-semibold">{t.checkEmail}</p>
        <p>
          {t.sentConfirmationTo}{' '}
          <strong>{registerState.email}</strong>.
        </p>
        <p className="text-emerald-700">{t.openToActivate}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {state && 'error' in state && state.error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-600">
          {isRegister ? t.registrationFailed : t.invalidCredentials}
        </div>
      )}

      <form action={action} className="space-y-4">
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

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-teal-600 px-4 py-2.5 font-medium text-white shadow-sm hover:bg-teal-700 disabled:opacity-50 transition-colors"
        >
          {isPending
            ? (isRegister ? t.creatingAccount : t.signingIn)
            : (isRegister ? t.createAccount : t.signIn)
          }
        </button>
      </form>

      <button
        type="button"
        onClick={() => setIsRegister(!isRegister)}
        className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
      >
        {isRegister ? t.haveAccountSignIn : t.noAccountRegister}
      </button>
    </div>
  )
}
