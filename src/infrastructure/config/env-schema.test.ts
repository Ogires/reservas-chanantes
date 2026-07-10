import { describe, it, expect } from 'vitest'
import { parseEnv } from './env-schema'

const base = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://x.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
  SUPABASE_SERVICE_ROLE_KEY: 'service',
}

describe('parseEnv', () => {
  it('valida un entorno correcto', () => {
    expect(parseEnv(base).NEXT_PUBLIC_SUPABASE_URL).toBe('https://x.supabase.co')
  })

  it('falla si falta un secreto obligatorio', () => {
    // Renombrado a `_omit` (patrón `/^_/`) para descartar la clave sin dejar
    // una variable «sin usar» que ensucie el lint; la semántica es idéntica.
    const { SUPABASE_SERVICE_ROLE_KEY: _omit, ...missing } = base
    expect(() => parseEnv(missing)).toThrow()
  })

  it('falla si la URL de Supabase no es una URL', () => {
    expect(() => parseEnv({ ...base, NEXT_PUBLIC_SUPABASE_URL: 'no-url' })).toThrow()
  })
})
