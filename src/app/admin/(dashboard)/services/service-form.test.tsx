// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ServiceForm } from './service-form'
import { getAdminTranslations } from '@/infrastructure/i18n/admin-translations'

// La server action solo se invoca al enviar; la sustituimos para no cargar
// código de servidor (Supabase) al renderizar el componente en el test.
vi.mock('./actions', () => ({ saveService: vi.fn() }))

const full = getAdminTranslations('es-ES')
const translations = { services: full.services, common: full.common }
const t = full.services

describe('ServiceForm', () => {
  it('renderiza los campos que ve el usuario (nombre, duración, precio) y el botón crear', () => {
    render(<ServiceForm translations={translations} />)
    expect(screen.getByLabelText(t.serviceName)).toBeInTheDocument()
    expect(screen.getByLabelText(t.duration)).toBeInTheDocument()
    expect(screen.getByLabelText(t.price)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: t.createService })
    ).toBeInTheDocument()
  })

  it('precarga los valores al editar un servicio existente y muestra "guardar"', () => {
    render(
      <ServiceForm
        service={{ id: 's-1', name: 'Corte de pelo', durationMinutes: 45, priceEur: 20, active: true }}
        translations={translations}
      />
    )
    expect(screen.getByLabelText(t.serviceName)).toHaveValue('Corte de pelo')
    expect(screen.getByLabelText(t.duration)).toHaveValue(45)
    expect(
      screen.getByRole('button', { name: t.updateService })
    ).toBeInTheDocument()
  })
})
