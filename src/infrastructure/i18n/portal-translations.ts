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
  errCancel: string
  errUpdate: string
  // Pantalla de acceso /my/login
  yourPortal: string
  signInToPortal: string
  or: string
  password: string
  signIn: string
  signingIn: string
  createAccount: string
  creatingAccount: string
  haveAccountSignIn: string
  noAccountRegister: string
  checkEmail: string
  sentConfirmationTo: string
  openToActivate: string
  invalidCredentials: string
  registrationFailed: string
  continueWithGoogle: string
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
  errCancel: 'No se pudo cancelar la reserva. Inténtalo de nuevo.',
  errUpdate: 'No se pudo actualizar el perfil. Inténtalo de nuevo.',
  yourPortal: 'Tu portal de reservas',
  signInToPortal: 'Accede a tu portal',
  or: 'o',
  password: 'Contraseña',
  signIn: 'Iniciar sesión',
  signingIn: 'Iniciando sesión...',
  createAccount: 'Crear cuenta',
  creatingAccount: 'Creando cuenta...',
  haveAccountSignIn: '¿Ya tienes cuenta? Inicia sesión',
  noAccountRegister: '¿No tienes cuenta? Regístrate',
  checkEmail: 'Revisa tu correo',
  sentConfirmationTo: 'Hemos enviado un enlace de confirmación a',
  openToActivate: 'Ábrelo para activar tu cuenta.',
  invalidCredentials: 'Credenciales inválidas.',
  registrationFailed: 'No se ha podido completar el registro.',
  continueWithGoogle: 'Continuar con Google',
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
  errCancel: 'Could not cancel the booking. Please try again.',
  errUpdate: 'Could not update your profile. Please try again.',
  yourPortal: 'Your booking portal',
  signInToPortal: 'Sign in to your portal',
  or: 'or',
  password: 'Password',
  signIn: 'Sign in',
  signingIn: 'Signing in...',
  createAccount: 'Create account',
  creatingAccount: 'Creating account...',
  haveAccountSignIn: 'Already have an account? Sign in',
  noAccountRegister: "Don't have an account? Register",
  checkEmail: 'Check your email',
  sentConfirmationTo: "We've sent a confirmation link to",
  openToActivate: 'Open it to activate your account.',
  invalidCredentials: 'Invalid credentials.',
  registrationFailed: 'Could not complete registration.',
  continueWithGoogle: 'Continue with Google',
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
