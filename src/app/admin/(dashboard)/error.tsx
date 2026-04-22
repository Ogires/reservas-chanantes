'use client'

import { useEffect } from 'react'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[admin] dashboard error:', error)
  }, [error])

  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 p-6">
      <h2 className="mb-2 text-lg font-semibold text-rose-900">
        Error en el panel
      </h2>
      <p className="mb-4 text-sm text-rose-800">
        Ha ocurrido un problema cargando esta sección.
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
