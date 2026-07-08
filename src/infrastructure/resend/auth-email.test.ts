import { describe, it, expect } from 'vitest'
import { renderAuthEmail, authOtpType } from './auth-email'

describe('authOtpType', () => {
  it('mapea los tipos de acción al type de verifyOtp', () => {
    expect(authOtpType('signup')).toBe('signup')
    expect(authOtpType('recovery')).toBe('recovery')
    expect(authOtpType('email_change')).toBe('email_change')
    expect(authOtpType('magiclink')).toBe('magiclink')
    expect(authOtpType('invite')).toBe('invite')
    expect(authOtpType('reauthentication')).toBe('email')
    expect(authOtpType('cualquier_otro')).toBe('email')
  })
})

describe('renderAuthEmail', () => {
  it('renderiza el correo de registro en español con el enlace', () => {
    const { subject, html } = renderAuthEmail('signup', 'es-ES', {
      url: 'https://x/confirm',
    })
    expect(subject).toContain('Confirma tu cuenta')
    expect(html).toContain('Confirmar mi cuenta')
    expect(html).toContain('https://x/confirm')
    expect(html).toContain('lang="es-ES"')
  })

  it('renderiza en inglés cuando el locale es en-US', () => {
    const { subject, html } = renderAuthEmail('recovery', 'en-US', {
      url: 'https://x/r',
    })
    expect(subject).toContain('Reset your password')
    expect(html).toContain('Change password')
    expect(html).toContain('This is an automated message')
  })

  it('muestra el código OTP en reauthentication (sin enlace)', () => {
    const { html } = renderAuthEmail('reauthentication', 'es-ES', {
      code: '123456',
    })
    expect(html).toContain('123456')
  })

  it('usa una plantilla genérica para tipos desconocidos', () => {
    const { subject } = renderAuthEmail('password_changed_notification', 'es-ES', {
      url: 'https://x',
    })
    expect(subject).toContain('Notificación de tu cuenta')
  })
})
