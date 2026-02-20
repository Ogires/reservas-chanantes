'use client'

import { useActionState } from 'react'
import { register } from './actions'

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(register, null)

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="rounded bg-red-50 p-3 text-sm text-red-600">
          {state.error}
        </div>
      )}

      <div>
        <label
          htmlFor="businessName"
          className="block text-sm font-medium mb-1"
        >
          Business Name
        </label>
        <input
          id="businessName"
          name="businessName"
          type="text"
          required
          placeholder="e.g. Peluquería Juan"
          className="w-full rounded border px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded border px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          className="w-full rounded border px-3 py-2"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? 'Creating account...' : 'Create account'}
      </button>
    </form>
  )
}
