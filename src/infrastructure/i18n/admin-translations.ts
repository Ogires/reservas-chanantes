import type { Locale } from '@/domain/types'

export interface AdminTranslations {
  common: {
    save: string
    saving: string
    cancel: string
    cancelling: string
    delete: string
    deleting: string
    back: string
    filter: string
    edit: string
    or: string
    closed: string
    remove: string
    inactive: string
    unknown: string
  }
  auth: {
    signIn: string
    signingIn: string
    signOut: string
    createAccount: string
    creatingAccount: string
    email: string
    password: string
    businessName: string
    businessNamePlaceholder: string
    forgotPassword: string
    sendResetLink: string
    sending: string
    goBack: string
    noAccount: string
    haveAccount: string
    continueWithGoogle: string
    checkEmailReset: string
    hello: (name: string) => string
    configureYourBusiness: string
    oauthSetupSubtitle: string
    registerSubtitle: string
    createMyPage: string
    configuringPage: string
  }
  nav: {
    dashboard: string
    bookings: string
    services: string
    schedule: string
    settings: string
    viewPublicPage: string
  }
  dashboard: {
    title: string
    activeServices: string
    todaysBookings: string
    publicPage: string
  }
  setup: {
    title: string
    subtitle: string
    createService: string
    defineSchedule: string
    shareBookingPage: string
  }
  services: {
    title: string
    newService: string
    editService: string
    backToServices: string
    serviceName: string
    serviceNamePlaceholder: string
    duration: string
    price: string
    activeLabel: string
    updateService: string
    createService: string
    noServicesYet: string
    dangerZone: string
    deleteService: string
    confirmDelete: string
  }
  bookings: {
    title: string
    from: string
    to: string
    noBookings: string
    date: string
    time: string
    service: string
    customer: string
    phone: string
    status: string
    actions: string
    confirmCancel: string
    statusPending: string
    statusConfirmed: string
    statusCancelled: string
  }
  schedule: {
    title: string
    timesInTimezone: (tz: string) => string
    addTimeRange: string
    saveSchedule: string
    savedSuccess: string
    days: string[]
  }
  settings: {
    title: string
    businessName: string
    timezone: string
    minAdvanceMinutes: string
    minAdvanceHelp: string
    maxAdvanceDays: string
    maxAdvanceHelp: string
    businessProfile: string
    businessCategory: string
    categoryHelp: string
    description: string
    descriptionPlaceholder: string
    descriptionHelp: string
    city: string
    cityPlaceholder: string
    phone: string
    phonePlaceholder: string
    address: string
    addressPlaceholder: string
    seo: string
    customPageTitle: string
    pageTitleHelp: string
    customMetaDescription: string
    metaDescriptionHelp: string
    savedSuccess: string
    stripePayments: string
    stripeConnectPrompt: string
    connectWithStripe: string
    stripePendingVerification: string
    stripeConnected: string
    stripeReadyToAccept: string
    openStripeDashboard: string
    language: string
    languageHelp: string
  }
}

const es: AdminTranslations = {
  common: {
    save: 'Guardar',
    saving: 'Guardando...',
    cancel: 'Cancelar',
    cancelling: 'Cancelando...',
    delete: 'Eliminar',
    deleting: 'Eliminando...',
    back: 'Volver',
    filter: 'Filtrar',
    edit: 'Editar',
    or: 'o',
    closed: 'Cerrado',
    remove: 'Quitar',
    inactive: 'inactivo',
    unknown: 'Desconocido',
  },
  auth: {
    signIn: 'Iniciar sesion',
    signingIn: 'Iniciando sesion...',
    signOut: 'Cerrar sesion',
    createAccount: 'Crear cuenta',
    creatingAccount: 'Creando cuenta...',
    email: 'Correo electronico',
    password: 'Contrasena',
    businessName: 'Nombre del negocio',
    businessNamePlaceholder: 'Ej: Peluqueria Juan',
    forgotPassword: '¿Olvidaste tu contrasena?',
    sendResetLink: 'Enviar enlace',
    sending: 'Enviando...',
    goBack: 'Volver',
    noAccount: '¿No tienes cuenta?',
    haveAccount: '¿Ya tienes una cuenta?',
    continueWithGoogle: 'Continuar con Google',
    checkEmailReset: 'Revisa tu correo para restablecer la contrasena.',
    hello: (name) => `Hola, ${name}`,
    configureYourBusiness: 'Configura tu negocio',
    oauthSetupSubtitle: 'Solo un paso mas: pon el nombre de tu negocio para crear tu pagina de reservas',
    registerSubtitle: 'Configura tu pagina de reservas en minutos',
    createMyPage: 'Crear mi pagina',
    configuringPage: 'Configurando...',
  },
  nav: {
    dashboard: 'Panel',
    bookings: 'Reservas',
    services: 'Servicios',
    schedule: 'Horario',
    settings: 'Ajustes',
    viewPublicPage: 'Ver pagina publica',
  },
  dashboard: {
    title: 'Panel',
    activeServices: 'Servicios activos',
    todaysBookings: 'Reservas de hoy',
    publicPage: 'Pagina publica',
  },
  setup: {
    title: 'Primeros pasos',
    subtitle: 'Completa estos pasos para empezar a recibir reservas.',
    createService: 'Crea un servicio',
    defineSchedule: 'Define tu horario',
    shareBookingPage: 'Comparte tu pagina de reservas',
  },
  services: {
    title: 'Servicios',
    newService: 'Nuevo servicio',
    editService: 'Editar servicio',
    backToServices: 'Volver a servicios',
    serviceName: 'Nombre del servicio',
    serviceNamePlaceholder: 'Ej: Corte de pelo',
    duration: 'Duracion (minutos)',
    price: 'Precio (EUR)',
    activeLabel: 'Activo (visible para clientes)',
    updateService: 'Actualizar servicio',
    createService: 'Crear servicio',
    noServicesYet: 'Aun no hay servicios. Crea tu primer servicio para empezar.',
    dangerZone: 'Zona peligrosa',
    deleteService: 'Eliminar servicio',
    confirmDelete: '¿Seguro que quieres eliminar este servicio?',
  },
  bookings: {
    title: 'Reservas',
    from: 'Desde',
    to: 'Hasta',
    noBookings: 'No hay reservas en este periodo.',
    date: 'Fecha',
    time: 'Hora',
    service: 'Servicio',
    customer: 'Cliente',
    phone: 'Telefono',
    status: 'Estado',
    actions: 'Acciones',
    confirmCancel: '¿Seguro que quieres cancelar esta reserva?',
    statusPending: 'Pendiente',
    statusConfirmed: 'Confirmada',
    statusCancelled: 'Cancelada',
  },
  schedule: {
    title: 'Horario semanal',
    timesInTimezone: (tz) => `Horarios en ${tz}`,
    addTimeRange: '+ Anadir franja horaria',
    saveSchedule: 'Guardar horario',
    savedSuccess: '¡Horario guardado correctamente!',
    days: ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'],
  },
  settings: {
    title: 'Ajustes',
    businessName: 'Nombre del negocio',
    timezone: 'Zona horaria',
    minAdvanceMinutes: 'Tiempo minimo de antelacion (minutos)',
    minAdvanceHelp: 'Con cuanta antelacion deben reservar los clientes. 0 = sin minimo.',
    maxAdvanceDays: 'Reserva maxima con antelacion (dias)',
    maxAdvanceHelp: 'Hasta cuantos dias en el futuro pueden reservar los clientes.',
    businessProfile: 'Perfil del negocio',
    businessCategory: 'Categoria del negocio',
    categoryHelp: 'Usado para resultados enriquecidos en buscadores.',
    description: 'Descripcion',
    descriptionPlaceholder: 'Cuenta a tus clientes sobre tu negocio...',
    descriptionHelp: 'Se muestra en tu pagina de reservas y en resultados de busqueda. Max 500 caracteres.',
    city: 'Ciudad',
    cityPlaceholder: 'Ej: Madrid',
    phone: 'Telefono',
    phonePlaceholder: '+34 612 345 678',
    address: 'Direccion',
    addressPlaceholder: 'Ej: Calle Gran Via 42',
    seo: 'SEO',
    customPageTitle: 'Titulo de pagina personalizado',
    pageTitleHelp: 'Dejalo vacio para usar el titulo auto-generado.',
    customMetaDescription: 'Meta descripcion personalizada',
    metaDescriptionHelp: 'Dejalo vacio para usar la descripcion auto-generada. Max 160 caracteres.',
    savedSuccess: 'Ajustes guardados correctamente.',
    stripePayments: 'Pagos con Stripe',
    stripeConnectPrompt: 'Conecta tu cuenta de Stripe para recibir pagos de clientes directamente.',
    connectWithStripe: 'Conectar con Stripe',
    stripePendingVerification: 'Tu cuenta de Stripe esta conectada pero pendiente de verificacion. Stripe te enviara un email cuando tu cuenta este lista para aceptar pagos.',
    stripeConnected: 'Conectado',
    stripeReadyToAccept: 'Tu cuenta de Stripe esta activa y lista para aceptar pagos.',
    openStripeDashboard: 'Abrir panel de Stripe',
    language: 'Idioma del panel',
    languageHelp: 'Cambia el idioma de la interfaz de administracion.',
  },
}

const en: AdminTranslations = {
  common: {
    save: 'Save',
    saving: 'Saving...',
    cancel: 'Cancel',
    cancelling: 'Cancelling...',
    delete: 'Delete',
    deleting: 'Deleting...',
    back: 'Back',
    filter: 'Filter',
    edit: 'Edit',
    or: 'or',
    closed: 'Closed',
    remove: 'Remove',
    inactive: 'inactive',
    unknown: 'Unknown',
  },
  auth: {
    signIn: 'Sign in',
    signingIn: 'Signing in...',
    signOut: 'Sign out',
    createAccount: 'Create account',
    creatingAccount: 'Creating account...',
    email: 'Email',
    password: 'Password',
    businessName: 'Business name',
    businessNamePlaceholder: 'e.g. John\'s Barbershop',
    forgotPassword: 'Forgot your password?',
    sendResetLink: 'Send link',
    sending: 'Sending...',
    goBack: 'Back',
    noAccount: 'Don\'t have an account?',
    haveAccount: 'Already have an account?',
    continueWithGoogle: 'Continue with Google',
    checkEmailReset: 'Check your email to reset your password.',
    hello: (name) => `Hello, ${name}`,
    configureYourBusiness: 'Set up your business',
    oauthSetupSubtitle: 'Just one more step: enter your business name to create your booking page',
    registerSubtitle: 'Set up your booking page in minutes',
    createMyPage: 'Create my page',
    configuringPage: 'Setting up...',
  },
  nav: {
    dashboard: 'Dashboard',
    bookings: 'Bookings',
    services: 'Services',
    schedule: 'Schedule',
    settings: 'Settings',
    viewPublicPage: 'View public page',
  },
  dashboard: {
    title: 'Dashboard',
    activeServices: 'Active services',
    todaysBookings: 'Today\'s bookings',
    publicPage: 'Public page',
  },
  setup: {
    title: 'Get started',
    subtitle: 'Complete these steps to start receiving bookings.',
    createService: 'Create a service',
    defineSchedule: 'Define your schedule',
    shareBookingPage: 'Share your booking page',
  },
  services: {
    title: 'Services',
    newService: 'New service',
    editService: 'Edit service',
    backToServices: 'Back to services',
    serviceName: 'Service name',
    serviceNamePlaceholder: 'e.g. Haircut',
    duration: 'Duration (minutes)',
    price: 'Price (EUR)',
    activeLabel: 'Active (visible to customers)',
    updateService: 'Update service',
    createService: 'Create service',
    noServicesYet: 'No services yet. Create your first service to get started.',
    dangerZone: 'Danger zone',
    deleteService: 'Delete service',
    confirmDelete: 'Are you sure you want to delete this service?',
  },
  bookings: {
    title: 'Bookings',
    from: 'From',
    to: 'To',
    noBookings: 'No bookings in this period.',
    date: 'Date',
    time: 'Time',
    service: 'Service',
    customer: 'Customer',
    phone: 'Phone',
    status: 'Status',
    actions: 'Actions',
    confirmCancel: 'Are you sure you want to cancel this booking?',
    statusPending: 'Pending',
    statusConfirmed: 'Confirmed',
    statusCancelled: 'Cancelled',
  },
  schedule: {
    title: 'Weekly Schedule',
    timesInTimezone: (tz) => `All times in ${tz}`,
    addTimeRange: '+ Add time range',
    saveSchedule: 'Save schedule',
    savedSuccess: 'Schedule saved successfully!',
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  },
  settings: {
    title: 'Settings',
    businessName: 'Business name',
    timezone: 'Timezone',
    minAdvanceMinutes: 'Minimum advance time (minutes)',
    minAdvanceHelp: 'How far in advance customers must book. 0 = no minimum.',
    maxAdvanceDays: 'Maximum advance booking (days)',
    maxAdvanceHelp: 'How far ahead customers can book.',
    businessProfile: 'Business Profile',
    businessCategory: 'Business category',
    categoryHelp: 'Used for search engine rich results.',
    description: 'Description',
    descriptionPlaceholder: 'Tell customers about your business...',
    descriptionHelp: 'Shown on your booking page and in search results. Max 500 characters.',
    city: 'City',
    cityPlaceholder: 'e.g. Madrid',
    phone: 'Phone',
    phonePlaceholder: '+34 612 345 678',
    address: 'Address',
    addressPlaceholder: 'e.g. Calle Gran Via 42',
    seo: 'SEO',
    customPageTitle: 'Custom page title',
    pageTitleHelp: 'Leave empty to use the auto-generated title.',
    customMetaDescription: 'Custom meta description',
    metaDescriptionHelp: 'Leave empty to use the auto-generated description. Max 160 characters.',
    savedSuccess: 'Settings saved successfully.',
    stripePayments: 'Stripe payments',
    stripeConnectPrompt: 'Connect your Stripe account to receive payments from customers directly.',
    connectWithStripe: 'Connect with Stripe',
    stripePendingVerification: 'Your Stripe account is connected but pending verification. Stripe will email you when your account is ready to accept payments.',
    stripeConnected: 'Connected',
    stripeReadyToAccept: 'Your Stripe account is active and ready to accept payments.',
    openStripeDashboard: 'Open Stripe Dashboard',
    language: 'Panel language',
    languageHelp: 'Changes the admin panel language.',
  },
}

const translations: Record<Locale, AdminTranslations> = {
  'es-ES': es,
  'en-US': en,
}

export function getAdminTranslations(locale: Locale): AdminTranslations {
  return translations[locale]
}
