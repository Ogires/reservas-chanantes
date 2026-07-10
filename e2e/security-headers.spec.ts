import { test, expect } from '@playwright/test'

test('la home responde con las cabeceras de seguridad', async ({ request }) => {
  const res = await request.get('/')
  const h = res.headers()
  expect(h['strict-transport-security']).toContain('max-age=')
  expect(h['x-frame-options']).toBe('DENY')
  expect(h['x-content-type-options']).toBe('nosniff')
  expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin')
  expect(h['content-security-policy']).toContain("default-src 'self'")
})
