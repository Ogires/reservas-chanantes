import { describe, it, expect } from 'vitest'
import { Password } from './password'
import { WeakPasswordError } from '@/domain/errors/domain-errors'

describe('Password', () => {
  const valid = 'Reserva2026!'

  it('acepta una contraseña que cumple la política', () => {
    expect(Password.create(valid).value).toBe(valid)
  })

  it('lista violaciones sin lanzar (para feedback en formulario)', () => {
    expect(Password.validate('short')).toContain('minLength')
    expect(Password.validate('alllowercase123!')).toContain('upper')
    expect(Password.validate('ALLUPPERCASE123!')).toContain('lower')
    expect(Password.validate('NoDigitsHere!!')).toContain('number')
    expect(Password.validate('NoSpecials12345')).toContain('special')
    expect(Password.validate(valid)).toEqual([])
  })

  it('lanza WeakPasswordError con contraseña débil', () => {
    expect(() => Password.create('123456')).toThrow(WeakPasswordError)
  })
})
