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
  // Serie (no paralelo): el E2E muta datos reales contra el despliegue; con
  // varios navegadores a la vez, todos elegirían el mismo hueco libre y
  // colisionarían. En serie, cada navegador reserva el siguiente hueco libre.
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'https://reservas-chanantes.vercel.app',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  // Cross-browser: el flujo crítico se valida en los tres motores (Chromium,
  // Firefox y WebKit), como recomienda el material del Máster.
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
})
