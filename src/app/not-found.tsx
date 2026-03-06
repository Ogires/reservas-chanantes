import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-warm-bg">
      <div className="text-center">
        <h1 className="font-serif text-5xl font-bold text-slate-900">404</h1>
        <p className="mt-4 text-lg text-slate-600">Page not found</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-coral px-5 py-2.5 text-sm font-medium text-white hover:bg-coral-dark transition-colors"
        >
          Go to homepage
        </Link>
      </div>
    </div>
  )
}
