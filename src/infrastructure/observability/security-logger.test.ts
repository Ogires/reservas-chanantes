import { describe, it, expect, vi } from 'vitest'
import { logSecurityEvent } from './security-logger'

describe('logSecurityEvent', () => {
  it('emite JSON estructurado con tipo y metadatos', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
    logSecurityEvent({ type: 'login_success', ip: '1.2.3.4', email: 'a@b.com' })
    const line = spy.mock.calls[0][0] as string
    const parsed = JSON.parse(line)
    expect(parsed.type).toBe('login_success')
    expect(parsed.channel).toBe('security')
    spy.mockRestore()
  })

  it('nunca serializa campos sensibles (password/token)', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
    // @ts-expect-error probamos que campos extra no listados no se filtran
    logSecurityEvent({ type: 'login_failure', ip: '1.2.3.4', password: 'secret' })
    expect(spy.mock.calls[0][0]).not.toContain('secret')
    spy.mockRestore()
  })
})
