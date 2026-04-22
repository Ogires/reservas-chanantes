'use client'

import { useEffect } from 'react'

export default function SlugError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[slug] route error:', error)
  }, [error])

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="mb-4 font-serif text-3xl text-slate-900">
        Algo no ha ido bien
      </h1>
      <p className="mb-8 text-slate-600">
        No hemos podido cargar esta página. Inténtalo de nuevo en unos segundos.
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-teal-600 px-6 py-3 font-medium text-white transition hover:bg-teal-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
      >
        Reintentar
      </button>
    </main>
  )
}
