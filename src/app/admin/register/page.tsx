import Link from 'next/link'
import { RegisterForm } from './register-form'

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <p className="text-lg font-bold text-slate-900">Reservas Chanantes</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
          <h1 className="text-2xl font-bold text-center text-slate-900 mb-2">Create your account</h1>
          <p className="text-center text-sm text-slate-500 mb-6">
            Set up your business booking page in minutes
          </p>
          <RegisterForm />
        </div>
        <p className="text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link href="/admin/login" className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
