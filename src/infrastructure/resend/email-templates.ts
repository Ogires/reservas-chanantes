import type { BookingEmailData } from '@/application/ports/notification-service'
import { getEmailTranslations } from './email-translations'
import { formatEmailDate } from './email-formatters'

function layout(tenantName: string, locale: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="utf-8" /></head>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333">
  <h2 style="color:#111">${tenantName}</h2>
  ${body}
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
  <p style="font-size:12px;color:#999">${getEmailTranslations(locale as 'es-ES' | 'en-US').footer(tenantName)}</p>
</body>
</html>`
}

function bookingDetails(data: BookingEmailData): string {
  const { booking, service, tenant } = data
  const locale = tenant.defaultLocale
  const t = getEmailTranslations(locale)
  const time = booking.timeRange.toHHMM()
  return `<table style="border-collapse:collapse;margin:16px 0">
    <tr><td style="padding:4px 12px 4px 0;font-weight:bold">${t.labels.service}</td><td>${service.name}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;font-weight:bold">${t.labels.date}</td><td>${formatEmailDate(booking.date, locale)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;font-weight:bold">${t.labels.time}</td><td>${time.start} – ${time.end}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;font-weight:bold">${t.labels.price}</td><td>${service.price.formatLocalized(locale)}</td></tr>
  </table>`
}

function customerDetails(data: BookingEmailData): string {
  const t = getEmailTranslations(data.tenant.defaultLocale)
  const { customer } = data
  return `<h3 style="margin:16px 0 8px">${t.labels.customer}</h3>
    <table style="border-collapse:collapse">
      <tr><td style="padding:4px 12px 4px 0;font-weight:bold">${t.labels.name}</td><td>${customer.name}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;font-weight:bold">${t.labels.email}</td><td>${customer.email}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;font-weight:bold">${t.labels.phone}</td><td>${customer.phone}</td></tr>
    </table>`
}

export function buildConfirmationHtml(data: BookingEmailData): string {
  const t = getEmailTranslations(data.tenant.defaultLocale)
  return layout(
    data.tenant.name,
    data.tenant.defaultLocale,
    `<p>${t.body.confirmationIntro}</p>${bookingDetails(data)}<p>${t.body.confirmationOutro}</p>`
  )
}

export function buildCancellationHtml(data: BookingEmailData): string {
  const t = getEmailTranslations(data.tenant.defaultLocale)
  return layout(
    data.tenant.name,
    data.tenant.defaultLocale,
    `<p>${t.body.cancellationIntro}</p>${bookingDetails(data)}<p>${t.body.cancellationOutro}</p>`
  )
}

export function buildReminderHtml(data: BookingEmailData): string {
  const t = getEmailTranslations(data.tenant.defaultLocale)
  return layout(
    data.tenant.name,
    data.tenant.defaultLocale,
    `<p>${t.body.reminderIntro}</p>${bookingDetails(data)}<p>${t.body.reminderOutro}</p>`
  )
}

export function buildOwnerNewBookingHtml(data: BookingEmailData): string {
  const t = getEmailTranslations(data.tenant.defaultLocale)
  return layout(
    data.tenant.name,
    data.tenant.defaultLocale,
    `<p>${t.body.ownerNewBookingIntro}</p>${bookingDetails(data)}${customerDetails(data)}`
  )
}

export function buildOwnerCancellationHtml(data: BookingEmailData): string {
  const t = getEmailTranslations(data.tenant.defaultLocale)
  return layout(
    data.tenant.name,
    data.tenant.defaultLocale,
    `<p>${t.body.ownerCancellationIntro}</p>${bookingDetails(data)}${customerDetails(data)}`
  )
}
