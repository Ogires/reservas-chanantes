'use client'

import { useState } from 'react'
import { toggleTenantActive } from './actions'

interface SuperadminRowActionsProps {
  tenantId: string
  active: boolean
  // Solo cadenas serializables: este componente cruza la frontera
  // servidor->cliente, así que no recibe funciones del diccionario.
  labels: {
    deactivate: string
    reactivate: string
    working: string
    confirmDeactivate: string
    confirmReactivate: string
  }
}

/**
 * Toggle de activacion de un negocio con confirmacion previa (`confirm()`) para
 * evitar clics accidentales en produccion. Llama a la server action
 * `toggleTenantActive` (guardada por `requireSuperadmin` + service-role), que
 * hace `revalidatePath('/superadmin')` y refresca la tabla.
 */
export function SuperadminRowActions({
  tenantId,
  active,
  labels,
}: SuperadminRowActionsProps) {
  const [pending, setPending] = useState(false)

  async function handleToggle() {
    const next = !active
    const message = next ? labels.confirmReactivate : labels.confirmDeactivate
    if (!confirm(message)) return
    setPending(true)
    try {
      await toggleTenantActive(tenantId, next)
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={pending}
      className={`text-sm font-medium disabled:opacity-50 transition-colors ${
        active
          ? 'text-rose-600 hover:text-rose-800'
          : 'text-emerald-600 hover:text-emerald-800'
      }`}
    >
      {pending ? labels.working : active ? labels.deactivate : labels.reactivate}
    </button>
  )
}
