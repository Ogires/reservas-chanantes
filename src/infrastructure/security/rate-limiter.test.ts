import { describe, it, expect } from 'vitest'
import { RateLimiter } from './rate-limiter'

describe('RateLimiter', () => {
  it('permite hasta max peticiones y bloquea la siguiente', () => {
    const rl = new RateLimiter({ windowMs: 1000, max: 3 })
    const t = 0
    const now = () => t
    expect(rl.check('ip', now)).toBe(true)
    expect(rl.check('ip', now)).toBe(true)
    expect(rl.check('ip', now)).toBe(true)
    expect(rl.check('ip', now)).toBe(false) // 4ª dentro de la ventana
  })

  it('vuelve a permitir cuando la ventana expira', () => {
    const rl = new RateLimiter({ windowMs: 1000, max: 1 })
    let t = 0
    const now = () => t
    expect(rl.check('ip', now)).toBe(true)
    expect(rl.check('ip', now)).toBe(false)
    t = 1001
    expect(rl.check('ip', now)).toBe(true)
  })

  it('aísla claves distintas', () => {
    const rl = new RateLimiter({ windowMs: 1000, max: 1 })
    const now = () => 0
    expect(rl.check('a', now)).toBe(true)
    expect(rl.check('b', now)).toBe(true)
  })
})
