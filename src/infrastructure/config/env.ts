import 'server-only'
import { parseEnv, type Env } from './env-schema'

// Validación fail-first PEREZOSA: el entorno se valida en el primer ACCESO a una
// variable (no en el import) y se cachea. Así la app falla de inmediato —con un
// mensaje claro y antes de causar daño— en cuanto se usa una variable ausente o
// inválida, sin acoplar `next build` (CI/local) a la presencia de secretos que
// solo existen en el entorno de ejecución (Vercel). En un runtime serverless,
// "primer acceso por función" es además la granularidad natural del arranque.
let cached: Env | undefined

function load(): Env {
  if (!cached) cached = parseEnv(process.env)
  return cached
}

export const env: Env = new Proxy({} as Env, {
  get(_target, prop) {
    return load()[prop as keyof Env]
  },
})
