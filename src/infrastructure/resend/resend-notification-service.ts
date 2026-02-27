import type {
  NotificationService,
  BookingEmailData,
} from '@/application/ports/notification-service'
import { getResend } from './client'
import { getEmailTranslations } from './email-translations'
import {
  buildConfirmationHtml,
  buildCancellationHtml,
  buildReminderHtml,
  buildOwnerNewBookingHtml,
  buildOwnerCancellationHtml,
} from './email-templates'

export class ResendNotificationService implements NotificationService {
  private async send(to: string, subject: string, html: string): Promise<void> {
    try {
      await getResend().emails.send({
        from: `notifications@${process.env.RESEND_FROM_DOMAIN ?? 'resend.dev'}`,
        to,
        subject,
        html,
      })
    } catch (error) {
      console.error('[ResendNotificationService] Failed to send email:', error)
    }
  }

  async sendBookingConfirmation(data: BookingEmailData): Promise<void> {
    const t = getEmailTranslations(data.tenant.defaultLocale)
    await this.send(
      data.customer.email,
      t.subjects.confirmation(data.service.name),
      buildConfirmationHtml(data)
    )
  }

  async sendBookingCancellation(data: BookingEmailData): Promise<void> {
    const t = getEmailTranslations(data.tenant.defaultLocale)
    await this.send(
      data.customer.email,
      t.subjects.cancellation(data.service.name),
      buildCancellationHtml(data)
    )
  }

  async sendBookingReminder(data: BookingEmailData): Promise<void> {
    const t = getEmailTranslations(data.tenant.defaultLocale)
    await this.send(
      data.customer.email,
      t.subjects.reminder(data.service.name),
      buildReminderHtml(data)
    )
  }

  async sendOwnerNewBooking(
    data: BookingEmailData,
    ownerEmail: string
  ): Promise<void> {
    const t = getEmailTranslations(data.tenant.defaultLocale)
    await this.send(
      ownerEmail,
      t.subjects.ownerNewBooking(data.service.name),
      buildOwnerNewBookingHtml(data)
    )
  }

  async sendOwnerCancellation(
    data: BookingEmailData,
    ownerEmail: string
  ): Promise<void> {
    const t = getEmailTranslations(data.tenant.defaultLocale)
    await this.send(
      ownerEmail,
      t.subjects.ownerCancellation(data.service.name),
      buildOwnerCancellationHtml(data)
    )
  }
}
