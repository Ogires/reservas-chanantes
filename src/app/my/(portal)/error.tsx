'use client'

import { useEffect } from 'react'

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[portal] error:', error)
  }, [error])

  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 p-6">
      <h2 className="mb-2 text-lg font-semibold text-rose-900">
        No hemos podido cargar tu información
      </h2>
      <p className="mb-4 text-sm text-rose-800">
        Por favor, inténtalo de nuevo. Si el problema persiste, cierra sesión y vuelve a entrar.
      </p>
      <button
        onClick={reset}
        className="rounded border border-rose-300 bg-white px-4 py-2 text-sm font-medium text-rose-900 transition hover:bg-rose-100"
      >
        Reintentar
      </button>
    </div>
  )
}
