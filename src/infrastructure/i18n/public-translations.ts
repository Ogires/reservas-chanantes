import type { Locale } from '@/domain/types'

/**
 * Diccionario del flujo PÚBLICO de reserva (página `/[slug]`, widget y página de
 * éxito). Se resuelve con la locale del negocio (`tenant.defaultLocale`) para que
 * el cliente final vea la reserva en el idioma del comercio.
 *
 * Todas las cadenas son STRINGS PLANOS (sin funciones): el objeto se pasa como
 * prop a componentes cliente (`booking-widget`, `slot-picker`) y debe cruzar la
 * frontera servidor→cliente. Las cadenas con parámetro usan marcadores `{x}` que
 * se sustituyen con `.replace(...)` en el punto de uso.
 */
export interface PublicTranslations {
  // Página / meta
  metaTitle: string // "Reserva cita en {name}"
  metaDescription: string // "…{name}…"
  bookOnline: string
  noServices: string
  bookingUnavailable: string
  // Barra de progreso
  stepService: string
  stepDate: string
  stepTime: string
  progressLabel: string
  step: string
  statusCompleted: string
  statusCurrent: string
  statusUpcoming: string
  // Selección de servicio / fecha / hora
  chooseService: string
  changeService: string
  backToService: string
  chooseDate: string
  selectDate: string
  availableFromTo: string // "Available from {from} to {to}"
  changeDate: string
  backToDate: string
  pickTime: string
  // Huecos
  loadingSlots: string
  noSlots: string
  chooseAnotherDate: string
  morning: string
  afternoon: string
  // Formulario
  selectedTime: string
  change: string
  yourName: string
  yourEmail: string
  yourPhone: string
  howToPay: string
  payOnline: string
  payOnSite: string
  confirming: string
  confirmBooking: string
  redirecting: string
  proceedToPayment: string
  bookingFailed: string
  // Éxito
  bookingConfirmed: string
  payAtVenueNote: string
  bookAnother: string
  manageBookings: string
  on: string // conector: "{service} {on} {date} {at} {time}"
  at: string
  confirmationSentTo: string // "Confirmation sent to {email}"
}

const es: PublicTranslations = {
  metaTitle: 'Reserva cita en {name}',
  metaDescription:
    'Reserva tu cita online en {name}. Elige servicio, dia y hora disponible. Confirmacion inmediata.',
  bookOnline: 'Reserva tu cita online',
  noServices: 'No hay servicios disponibles por el momento. Vuelve más tarde.',
  bookingUnavailable:
    'La reserva online no está disponible ahora mismo. Contacta directamente con el negocio.',
  stepService: 'Servicio',
  stepDate: 'Fecha',
  stepTime: 'Hora',
  progressLabel: 'Progreso de la reserva',
  step: 'Paso',
  statusCompleted: 'completado',
  statusCurrent: 'actual',
  statusUpcoming: 'pendiente',
  chooseService: 'Elige un servicio',
  changeService: 'Cambiar servicio',
  backToService: 'Volver a la selección de servicio',
  chooseDate: 'Elige una fecha',
  selectDate: 'Selecciona una fecha',
  availableFromTo: 'Disponible del {from} al {to}',
  changeDate: 'Cambiar fecha',
  backToDate: 'Volver a la selección de fecha',
  pickTime: 'Elige una hora',
  loadingSlots: 'Cargando horas disponibles...',
  noSlots: 'No hay horas disponibles en esta fecha. Elige otra fecha.',
  chooseAnotherDate: 'Elegir otra fecha',
  morning: 'Mañana',
  afternoon: 'Tarde',
  selectedTime: 'Hora seleccionada:',
  change: 'cambiar',
  yourName: 'Tu nombre',
  yourEmail: 'Tu email',
  yourPhone: 'Tu teléfono',
  howToPay: '¿Cómo quieres pagar?',
  payOnline: 'Pagar ahora (online)',
  payOnSite: 'Pagar en el centro',
  confirming: 'Confirmando...',
  confirmBooking: 'Confirmar reserva',
  redirecting: 'Redirigiendo...',
  proceedToPayment: 'Ir al pago',
  bookingFailed: 'No se pudo completar la reserva',
  bookingConfirmed: '¡Reserva confirmada!',
  payAtVenueNote: 'Pagarás en el centro al llegar.',
  bookAnother: 'Reservar otra cita',
  manageBookings: 'Gestiona tus reservas',
  on: 'el',
  at: 'a las',
  confirmationSentTo: 'Confirmación enviada a {email}',
}

const en: PublicTranslations = {
  metaTitle: 'Book an appointment at {name}',
  metaDescription:
    'Book your appointment online at {name}. Choose a service, day and available time. Instant confirmation.',
  bookOnline: 'Book your appointment online',
  noServices: 'No services available at the moment. Please check back later.',
  bookingUnavailable:
    'Online booking is not available right now. Please contact the business directly.',
  stepService: 'Service',
  stepDate: 'Date',
  stepTime: 'Time',
  progressLabel: 'Booking progress',
  step: 'Step',
  statusCompleted: 'completed',
  statusCurrent: 'current',
  statusUpcoming: 'upcoming',
  chooseService: 'Choose a service',
  changeService: 'Change service',
  backToService: 'Go back to service selection',
  chooseDate: 'Choose a date',
  selectDate: 'Select a date',
  availableFromTo: 'Available from {from} to {to}',
  changeDate: 'Change date',
  backToDate: 'Go back to date selection',
  pickTime: 'Pick a time',
  loadingSlots: 'Loading available slots...',
  noSlots: 'No available slots on this date. Please choose another date.',
  chooseAnotherDate: 'Choose another date',
  morning: 'Morning',
  afternoon: 'Afternoon',
  selectedTime: 'Selected time:',
  change: 'change',
  yourName: 'Your name',
  yourEmail: 'Your email',
  yourPhone: 'Your phone',
  howToPay: 'How would you like to pay?',
  payOnline: 'Pay now (online)',
  payOnSite: 'Pay at the venue',
  confirming: 'Confirming...',
  confirmBooking: 'Confirm booking',
  redirecting: 'Redirecting...',
  proceedToPayment: 'Proceed to payment',
  bookingFailed: 'Booking failed',
  bookingConfirmed: 'Booking confirmed!',
  payAtVenueNote: 'You will pay at the venue when you arrive.',
  bookAnother: 'Book another appointment',
  manageBookings: 'Manage your bookings',
  on: 'on',
  at: 'at',
  confirmationSentTo: 'Confirmation sent to {email}',
}

const translations: Record<Locale, PublicTranslations> = {
  'es-ES': es,
  'en-US': en,
}

export function getPublicTranslations(locale: Locale): PublicTranslations {
  return translations[locale] ?? es
}
