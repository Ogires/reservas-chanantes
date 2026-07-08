import { defineConfig, devices } from '@playwright/test'

/**
 * Pruebas E2E del flujo crítico de reserva contra el despliegue (o un
 * `E2E_BASE_URL` alternativo). Complementan la cobertura unitaria: validan la
 * capa de presentación (rutas, server actions, UI) de extremo a extremo.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  retries: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'https://reservas-chanantes.vercel.app',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
