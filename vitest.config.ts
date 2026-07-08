import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      // Se mide la lógica: dominio, aplicación e infraestructura (adaptadores).
      // La capa de presentación (`src/app`: rutas, server actions y componentes)
      // se valida mediante pruebas E2E de Playwright, no por cobertura de líneas.
      include: [
        'src/domain/**',
        'src/application/**',
        'src/infrastructure/**',
      ],
      exclude: [
        '**/*.test.ts',
        // Solo tipos/interfaces (sin código ejecutable)
        'src/domain/types.ts',
        'src/domain/entities/**',
        'src/application/ports/**',
        // Glue de SDKs externos (clientes/singletons), no unitario
        'src/infrastructure/**/client.ts',
        'src/infrastructure/supabase/server.ts',
        'src/infrastructure/supabase/admin-client.ts',
        // Glue de sesión (redirect + createSupabaseServer) → validado por E2E
        'src/infrastructure/supabase/admin-auth.ts',
        'src/infrastructure/supabase/customer-auth.ts',
        'src/infrastructure/supabase/repositories.ts',
        // Orquestación del cron de recordatorios → validada por integración
        'src/infrastructure/resend/send-booking-emails.ts',
      ],
      // Umbral que actúa de puerta de calidad (falla el build si no se alcanza).
      thresholds: {
        statements: 85,
        functions: 85,
        lines: 85,
        branches: 75,
      },
    },
  },
})
