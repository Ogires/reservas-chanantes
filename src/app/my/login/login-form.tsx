'use client'

import { useActionState, useState } from 'react'
import { customerLogin, customerRegister } from './actions'

export function CustomerLoginForm() {
  const [isRegister, setIsRegister] = useState(false)
  const [loginState, loginAction, isLoggingIn] = useActionState(customerLogin, null)
  const [registerState, registerAction, isRegistering] = useActionState(customerRegister, null)

  const state = isRegister ? registerState : loginState
  const action = isRegister ? registerAction : loginAction
  const isPending = isRegister ? isRegistering : isLoggingIn

  return (
    <div className="space-y-4">
      {state?.error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-600">
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
            Email
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
            Password
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
            ? (isRegister ? 'Creating account...' : 'Signing in...')
            : (isRegister ? 'Create account' : 'Sign in')
          }
        </button>
      </form>

      <button
        type="button"
        onClick={() => setIsRegister(!isRegister)}
        className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
      >
        {isRegister
          ? 'Already have an account? Sign in'
          : "Don't have an account? Register"
        }
      </button>
    </div>
  )
}
