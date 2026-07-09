import { test, expect } from '@playwright/test'

/** Próximo día laborable (L–V) al menos `daysAhead` días por delante, en
 * formato YYYY-MM-DD, para respetar la antelación mínima y el horario. */
function nextOpenWeekday(daysAhead = 4): string {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

test.describe('Flujo de reserva (extremo a extremo)', () => {
  test('el cliente reserva pagando en el centro y ve la confirmación', async ({
    page,
  }) => {
    // Página pública de un negocio con "pago en el centro" activado
    await page.goto('/barberia-qa')

    // 1) Elegir servicio
    await page.getByRole('button', { name: /Corte caballero/i }).click()

    // 2) Elegir fecha (próximo día laborable)
    await page
      .getByRole('textbox', { name: /Select a date/i })
      .fill(nextOpenWeekday())

    // 3) Elegir el primer hueco disponible
    // El primer hueco DISPONIBLE (los ya reservados salen deshabilitados)
    await page
      .getByRole('button', { name: /^\d{2}:\d{2}$/, disabled: false })
      .first()
      .click()

    // 4) Datos del cliente
    await page.getByRole('textbox', { name: /Your name/i }).fill('E2E Playwright')
    await page
      .getByRole('textbox', { name: /Your email/i })
      .fill('e2e@example.com')
    await page
      .getByRole('textbox', { name: /Your phone/i })
      .fill('+34 600 000 000')

    // 5) Confirmar (pago en el centro → sin pasarela)
    await page.getByRole('button', { name: /Confirm booking/i }).click()

    // 6) Verificar la confirmación
    await expect(page.getByText(/Booking confirmed/i)).toBeVisible()
    await expect(page.getByText(/pay at the venue/i)).toBeVisible()
  })

  test('la página pública muestra el catálogo de servicios', async ({ page }) => {
    await page.goto('/peluqueria-aurora')
    await expect(
      page.getByRole('heading', { name: /Peluquería Aurora/i })
    ).toBeVisible()
    await expect(page.getByRole('button', { name: /Corte de pelo/i })).toBeVisible()
  })
})
