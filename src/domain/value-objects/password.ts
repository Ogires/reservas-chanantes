import { WeakPasswordError } from '@/domain/errors/domain-errors'

/** Política de contraseñas A07: 12+, mayúscula, minúscula, número y especial. */
export class Password {
  private constructor(public readonly value: string) {}

  /** Devuelve la lista de reglas incumplidas (vacía si es válida). */
  static validate(raw: string): string[] {
    const violations: string[] = []
    if (raw.length < 12) violations.push('minLength')
    if (!/[A-Z]/.test(raw)) violations.push('upper')
    if (!/[a-z]/.test(raw)) violations.push('lower')
    if (!/[0-9]/.test(raw)) violations.push('number')
    if (!/[^A-Za-z0-9]/.test(raw)) violations.push('special')
    return violations
  }

  static create(raw: string): Password {
    if (Password.validate(raw).length > 0) throw new WeakPasswordError()
    return new Password(raw)
  }
}
