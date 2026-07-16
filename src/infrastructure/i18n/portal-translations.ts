import type { Locale } from '@/domain/types'

/**
 * Diccionario del PORTAL del cliente (`/my`). Se resuelve con la preferencia del
 * cliente (`customer.preferredLocale`); si no la tiene, cae a español (idioma por
 * defecto de la plataforma), ya que el portal agrega reservas de varios negocios
 * y no hay una única locale de negocio aplicable.
 *
 * Strings planos: se pasan como props a los componentes cliente (portal-nav,
 * cancel-booking-button, profile-form).
 */
export interface PortalTranslations {
  myBookings: string
  upcoming: string
  history: string
  profile: string
  signOut: string
  upcomingBookings: string
  noUpcoming: string
  unknownService: string
  bookAgain: string
  bookingHistory: string
  noBookings: string
  statusConfirmed: string
  statusPending: string
  statusCancelled: string
  cancelled: string
  cancelling: string
  cancel: string
  myProfile: string
  completeProfile: string
  profileUpdated: string
  email: string
  name: string
  phone: string
  preferredLanguage: string
  useBusinessDefault: string
  saving: string
  saveProfile: string
  paymentPaid: string
  paymentPending: string
  paymentOnsite: string
}

const es: PortalTranslations = {
  myBookings: 'Mis reservas',
  upcoming: 'Próximas',
  history: 'Historial',
  profile: 'Perfil',
  signOut: 'Cerrar sesión',
  upcomingBookings: 'Próximas citas',
  noUpcoming: 'No tienes próximas citas',
  unknownService: 'Servicio desconocido',
  bookAgain: 'Reservar otra vez',
  bookingHistory: 'Historial de reservas',
  noBookings: 'Aún no tienes reservas',
  statusConfirmed: 'Confirmada',
  statusPending: 'Pendiente',
  statusCancelled: 'Cancelada',
  cancelled: 'Cancelada',
  cancelling: 'Cancelando...',
  cancel: 'Cancelar',
  myProfile: 'Mi perfil',
  completeProfile: 'Completa tu perfil para empezar.',
  profileUpdated: 'Perfil actualizado correctamente.',
  email: 'Email',
  name: 'Nombre',
  phone: 'Teléfono',
  preferredLanguage: 'Idioma preferido',
  useBusinessDefault: 'Usar el idioma del negocio',
  saving: 'Guardando...',
  saveProfile: 'Guardar perfil',
  paymentPaid: 'Pagado online',
  paymentPending: 'Pago pendiente',
  paymentOnsite: 'En el centro',
}

const en: PortalTranslations = {
  myBookings: 'My Bookings',
  upcoming: 'Upcoming',
  history: 'History',
  profile: 'Profile',
  signOut: 'Sign out',
  upcomingBookings: 'Upcoming bookings',
  noUpcoming: 'No upcoming bookings',
  unknownService: 'Unknown service',
  bookAgain: 'Book again',
  bookingHistory: 'Booking history',
  noBookings: 'No bookings yet',
  statusConfirmed: 'Confirmed',
  statusPending: 'Pending',
  statusCancelled: 'Cancelled',
  cancelled: 'Cancelled',
  cancelling: 'Cancelling...',
  cancel: 'Cancel',
  myProfile: 'My profile',
  completeProfile: 'Complete your profile to get started.',
  profileUpdated: 'Profile updated successfully.',
  email: 'Email',
  name: 'Name',
  phone: 'Phone',
  preferredLanguage: 'Preferred language',
  useBusinessDefault: 'Use business default',
  saving: 'Saving...',
  saveProfile: 'Save profile',
  paymentPaid: 'Paid online',
  paymentPending: 'Payment pending',
  paymentOnsite: 'At the venue',
}

const translations: Record<Locale, PortalTranslations> = {
  'es-ES': es,
  'en-US': en,
}

/** Resuelve la locale del portal desde la preferencia del cliente (fallback ES). */
export function resolvePortalLocale(preferred?: string | null): Locale {
  return preferred?.toLowerCase().startsWith('en') ? 'en-US' : 'es-ES'
}

export function getPortalTranslations(locale: Locale): PortalTranslations {
  return translations[locale] ?? es
}
