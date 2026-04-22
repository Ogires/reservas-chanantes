'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[global] error:', error)
  }, [error])

  return (
    <html lang="es">
      <body
        style={{
          fontFamily: 'system-ui, sans-serif',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
          Error inesperado
        </h1>
        <p style={{ marginBottom: '1.5rem', color: '#475569' }}>
          La aplicación ha encontrado un error. Recarga la página para volver a intentarlo.
        </p>
        <button
          onClick={reset}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#0d9488',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
          }}
        >
          Recargar
        </button>
      </body>
    </html>
  )
}
