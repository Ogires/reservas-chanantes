import Link from 'next/link'
import { RegisterForm } from './register-form'

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 p-6">
        <h1 className="text-2xl font-bold text-center">Create your account</h1>
        <p className="text-center text-sm text-gray-600">
          Set up your business booking page in minutes
        </p>
        <RegisterForm />
        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/admin/login" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
