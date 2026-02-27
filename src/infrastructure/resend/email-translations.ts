import type { Locale } from '@/domain/types'

export interface EmailTranslations {
  labels: {
    service: string
    date: string
    time: string
    price: string
    name: string
    email: string
    phone: string
    customer: string
  }
  subjects: {
    confirmation: (serviceName: string) => string
    cancellation: (serviceName: string) => string
    reminder: (serviceName: string) => string
    ownerNewBooking: (serviceName: string) => string
    ownerCancellation: (serviceName: string) => string
  }
  body: {
    confirmationIntro: string
    confirmationOutro: string
    cancellationIntro: string
    cancellationOutro: string
    reminderIntro: string
    reminderOutro: string
    ownerNewBookingIntro: string
    ownerCancellationIntro: string
  }
  footer: (tenantName: string) => string
}

const es: EmailTranslations = {
  labels: {
    service: 'Servicio',
    date: 'Fecha',
    time: 'Hora',
    price: 'Precio',
    name: 'Nombre',
    email: 'Email',
    phone: 'Teléfono',
    customer: 'Cliente',
  },
  subjects: {
    confirmation: (s) => `Reserva confirmada – ${s}`,
    cancellation: (s) => `Reserva cancelada – ${s}`,
    reminder: (s) => `Recordatorio: ${s} mañana`,
    ownerNewBooking: (s) => `Nueva reserva: ${s}`,
    ownerCancellation: (s) => `Reserva cancelada: ${s}`,
  },
  body: {
    confirmationIntro: '¡Tu reserva ha sido confirmada!',
    confirmationOutro: '¡Te esperamos!',
    cancellationIntro: 'Tu reserva ha sido cancelada.',
    cancellationOutro: 'Si tienes alguna pregunta, no dudes en contactarnos.',
    reminderIntro: '¡Recordatorio: tienes una reserva mañana!',
    reminderOutro: '¡Nos vemos pronto!',
    ownerNewBookingIntro: '¡Tienes una nueva reserva!',
    ownerCancellationIntro: 'Se ha cancelado una reserva.',
  },
  footer: (name) => `Este es un mensaje automático de ${name}.`,
}

const en: EmailTranslations = {
  labels: {
    service: 'Service',
    date: 'Date',
    time: 'Time',
    price: 'Price',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    customer: 'Customer',
  },
  subjects: {
    confirmation: (s) => `Booking confirmed – ${s}`,
    cancellation: (s) => `Booking cancelled – ${s}`,
    reminder: (s) => `Reminder: ${s} tomorrow`,
    ownerNewBooking: (s) => `New booking: ${s}`,
    ownerCancellation: (s) => `Booking cancelled: ${s}`,
  },
  body: {
    confirmationIntro: 'Your booking has been confirmed!',
    confirmationOutro: 'See you then!',
    cancellationIntro: 'Your booking has been cancelled.',
    cancellationOutro: 'If you have any questions, please contact us.',
    reminderIntro: 'Reminder: you have a booking tomorrow!',
    reminderOutro: 'See you soon!',
    ownerNewBookingIntro: 'You have a new booking!',
    ownerCancellationIntro: 'A booking has been cancelled.',
  },
  footer: (name) => `This is an automated message from ${name}.`,
}

const translations: Record<Locale, EmailTranslations> = {
  'es-ES': es,
  'en-US': en,
}

export function getEmailTranslations(locale: Locale): EmailTranslations {
  return translations[locale]
}
