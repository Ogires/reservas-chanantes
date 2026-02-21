import Link from 'next/link'
import { LoginForm } from './login-form'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <p className="text-lg font-bold text-slate-900">Reservas Chanantes</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
          <h1 className="text-2xl font-bold text-center text-slate-900 mb-6">Sign in</h1>
          <LoginForm />
        </div>
        <p className="text-center text-sm text-slate-500">
          Don&apos;t have an account?{' '}
          <Link href="/admin/register" className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}
