import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <main className="text-center space-y-6 px-4">
        <h1 className="text-4xl font-bold">Reservas Chanantes</h1>
        <p className="text-lg text-gray-600 max-w-md mx-auto">
          Create your online booking page in minutes. Let customers book
          appointments 24/7.
        </p>
        <Link
          href="/admin/register"
          className="inline-block rounded bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700"
        >
          Get Started
        </Link>
        <p className="text-sm text-gray-400">
          Already have an account?{' '}
          <Link href="/admin/login" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </main>
    </div>
  )
}
