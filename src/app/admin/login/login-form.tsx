'use client'

import { useActionState, useState } from 'react'
import { login, resetPassword } from './actions'

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, null)
  const [resetState, resetFormAction, isResetting] = useActionState(resetPassword, null)
  const [showReset, setShowReset] = useState(false)

  if (showReset) {
    return (
      <div className="space-y-4">
        {resetState?.error && (
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-600">
            {resetState.error}
          </div>
        )}
        {resetState?.success && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-600">
            Check your email for a reset link.
          </div>
        )}

        <form action={resetFormAction} className="space-y-4">
          <div>
            <label htmlFor="reset-email" className="block text-sm font-medium text-slate-700 mb-1.5">
              Email
            </label>
            <input
              id="reset-email"
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isResetting}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isResetting ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        <button
          onClick={() => setShowReset(false)}
          className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          Back to login
        </button>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-600">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {isPending ? 'Signing in...' : 'Sign in'}
      </button>

      <button
        type="button"
        onClick={() => setShowReset(true)}
        className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
      >
        Forgot your password?
      </button>
    </form>
  )
}
