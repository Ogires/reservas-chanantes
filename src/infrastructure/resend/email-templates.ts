import type { BookingEmailData } from '@/application/ports/notification-service'

function layout(tenantName: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333">
  <h2 style="color:#111">${tenantName}</h2>
  ${body}
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
  <p style="font-size:12px;color:#999">This is an automated message from ${tenantName}.</p>
</body>
</html>`
}

function bookingDetails(data: BookingEmailData): string {
  const { booking, service } = data
  const time = booking.timeRange.toHHMM()
  return `<table style="border-collapse:collapse;margin:16px 0">
    <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Service</td><td>${service.name}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Date</td><td>${booking.date}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Time</td><td>${time.start} – ${time.end}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Price</td><td>${service.price.format()}</td></tr>
  </table>`
}

export function buildConfirmationHtml(data: BookingEmailData): string {
  return layout(
    data.tenant.name,
    `<p>Your booking has been confirmed!</p>${bookingDetails(data)}<p>See you then!</p>`
  )
}

export function buildCancellationHtml(data: BookingEmailData): string {
  return layout(
    data.tenant.name,
    `<p>Your booking has been cancelled.</p>${bookingDetails(data)}<p>If you have any questions, please contact us.</p>`
  )
}

export function buildReminderHtml(data: BookingEmailData): string {
  return layout(
    data.tenant.name,
    `<p>Reminder: you have a booking tomorrow!</p>${bookingDetails(data)}<p>See you soon!</p>`
  )
}

export function buildOwnerNewBookingHtml(
  data: BookingEmailData
): string {
  const { customer } = data
  return layout(
    data.tenant.name,
    `<p>You have a new booking!</p>${bookingDetails(data)}
    <h3 style="margin:16px 0 8px">Customer</h3>
    <table style="border-collapse:collapse">
      <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Name</td><td>${customer.name}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Email</td><td>${customer.email}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Phone</td><td>${customer.phone}</td></tr>
    </table>`
  )
}

export function buildOwnerCancellationHtml(
  data: BookingEmailData
): string {
  const { customer } = data
  return layout(
    data.tenant.name,
    `<p>A booking has been cancelled.</p>${bookingDetails(data)}
    <h3 style="margin:16px 0 8px">Customer</h3>
    <table style="border-collapse:collapse">
      <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Name</td><td>${customer.name}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Email</td><td>${customer.email}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Phone</td><td>${customer.phone}</td></tr>
    </table>`
  )
}
