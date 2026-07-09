// @vitest-environment happy-dom
import type { ReactNode, AnchorHTMLAttributes } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AyudaNav, LangToggle } from './nav'

// La ruta actual determina el paso activo y el destino del toggle de idioma.
vi.mock('next/navigation', () => ({
  usePathname: () => '/ayuda/es/servicios',
}))
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: { href: string; children?: ReactNode } & AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}))

const steps = [
  { slug: 'registro', number: 1, title: 'Crea tu cuenta' },
  { slug: 'servicios', number: 3, title: 'Añade tus servicios' },
]

describe('AyudaNav', () => {
  it('muestra el enlace de introducción y un enlace por paso', () => {
    render(
      <AyudaNav
        lang="es"
        steps={steps}
        overviewLabel="Introducción"
        onThisPageLabel="Pasos"
      />
    )
    expect(screen.getByRole('link', { name: 'Introducción' })).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /Añade tus servicios/ })
    ).toBeInTheDocument()
  })

  it('marca el paso activo según la ruta actual (aria-current)', () => {
    render(
      <AyudaNav
        lang="es"
        steps={steps}
        overviewLabel="Introducción"
        onThisPageLabel="Pasos"
      />
    )
    expect(
      screen.getByRole('link', { name: /Añade tus servicios/ })
    ).toHaveAttribute('aria-current', 'page')
    expect(
      screen.getByRole('link', { name: /Crea tu cuenta/ })
    ).not.toHaveAttribute('aria-current')
  })
})

describe('LangToggle', () => {
  it('enlaza al mismo paso en el otro idioma', () => {
    render(<LangToggle lang="es" />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/ayuda/en/servicios')
    expect(link).toHaveTextContent('EN')
  })
})
