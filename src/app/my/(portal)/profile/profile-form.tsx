'use client'

import { useActionState } from 'react'
import { updateProfile } from './actions'

interface ProfileFormProps {
  name: string
  email: string
  phone: string
  preferredLocale?: string
  isSetup?: boolean
}

export function ProfileForm({ name, email, phone, preferredLocale, isSetup }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(updateProfile, null)

  return (
    <form action={formAction} className="space-y-5">
      {isSetup && (
        <div className="rounded-lg bg-teal-50 border border-teal-200 p-3 text-sm text-teal-700">
          Complete your profile to get started.
        </div>
      )}

      {state?.error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-600">
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-600">
          Profile updated successfully.
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          disabled
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500"
        />
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={name}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1.5">
          Phone
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          defaultValue={phone}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
        />
      </div>

      <div>
        <label htmlFor="preferredLocale" className="block text-sm font-medium text-slate-700 mb-1.5">
          Preferred language
        </label>
        <select
          id="preferredLocale"
          name="preferredLocale"
          defaultValue={preferredLocale ?? ''}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
        >
          <option value="">Use business default</option>
          <option value="es-ES">Español</option>
          <option value="en-US">English</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-teal-600 px-4 py-2.5 font-medium text-white shadow-sm hover:bg-teal-700 disabled:opacity-50 transition-colors"
      >
        {isPending ? 'Saving...' : 'Save profile'}
      </button>
    </form>
  )
}
