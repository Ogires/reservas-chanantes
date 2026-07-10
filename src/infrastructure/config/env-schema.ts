import { z } from 'zod'

// Secretos y config de servidor. Los opcionales corresponden a integraciones
// que pueden no estar activas en un entorno dado (p. ej. Stripe/Resend en local).
// En Zod v4 la validación de URL es la función de primer nivel `z.url()`
// (`z.string().url()` quedó deprecada).
const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  STRIPE_CONNECT_WEBHOOK_SECRET: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_DOMAIN: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(1).optional(),
  SUPABASE_AUTH_HOOK_SECRET: z.string().min(1).optional(),
  NEXT_PUBLIC_SITE_URL: z.url().optional(),
  NEXT_PUBLIC_APP_URL: z.url().optional(),
})

export type Env = z.infer<typeof envSchema>

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source)
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n')
    // Fail-first: no arrancamos sin config válida. Nunca imprimimos el valor.
    throw new Error(`Variables de entorno inválidas:\n${issues}`)
  }
  return result.data
}
