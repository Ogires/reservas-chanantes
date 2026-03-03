import { CustomerLoginForm } from './login-form'
import { CustomerGoogleSignInButton } from './google-sign-in-button'

export default function CustomerLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <p className="text-lg font-bold font-serif text-slate-900">Reservas Chanantes</p>
          <p className="text-sm text-slate-500 mt-1">Your booking portal</p>
        </div>
        <div className="rounded-2xl border border-[var(--color-warm-border)] bg-white p-8 shadow-lg">
          <h1 className="text-2xl font-bold font-serif text-center text-slate-900 mb-6">
            Sign in to your portal
          </h1>
          <CustomerGoogleSignInButton />
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--color-warm-border)]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-slate-400">or</span>
            </div>
          </div>
          <CustomerLoginForm />
        </div>
      </div>
    </div>
  )
}
