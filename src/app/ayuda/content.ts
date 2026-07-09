// Contenido de la guía del comerciante (/ayuda). Bilingüe ES/EN, sin dependencia
// del i18n del panel: es una sección pública autocontenida. Las capturas se
// referencian desde /public/img/ayuda y son opcionales por paso.

export type AyudaLang = 'es' | 'en'

export const AYUDA_LANGS: readonly AyudaLang[] = ['es', 'en'] as const

export function isAyudaLang(value: string): value is AyudaLang {
  return value === 'es' || value === 'en'
}

export interface Screenshot {
  src: string
  alt: string
  caption?: string
  /** Dimensiones intrínsecas (para next/image sin distorsión). */
  width?: number
  height?: number
}

export interface StepCopy {
  /** Título del paso */
  title: string
  /** Una línea para tarjetas y barra lateral */
  summary: string
  /** 1-2 frases de introducción */
  intro: string
  /** Instrucciones numeradas */
  instructions: string[]
  /** Consejo opcional destacado */
  tip?: string
}

export interface AyudaStep {
  slug: string
  number: number
  /** Captura por defecto (UI en español). */
  screenshot?: Screenshot
  /** Captura para la guía en inglés (UI en inglés); si falta, se usa `screenshot`. */
  screenshotEn?: Screenshot
  es: StepCopy
  en: StepCopy
}

/** Devuelve la captura adecuada al idioma de la guía. */
export function screenshotFor(step: AyudaStep, lang: AyudaLang): Screenshot | undefined {
  if (lang === 'en' && step.screenshotEn) return step.screenshotEn
  return step.screenshot
}

export const AYUDA_STEPS: AyudaStep[] = [
  {
    slug: 'registro',
    number: 1,
    screenshot: {
      src: '/img/ayuda/1-registro.png',
      alt: 'Formulario de registro de un negocio',
      width: 1280,
      height: 900,
    },
    screenshotEn: {
      src: '/img/ayuda/1-registro-en.png',
      alt: 'Business sign-up form',
      width: 1280,
      height: 900,
    },
    es: {
      title: 'Crea tu cuenta',
      summary: 'Registra tu negocio en un minuto.',
      intro:
        'Lo primero es dar de alta tu negocio. Solo necesitas un nombre, un correo y una contraseña.',
      instructions: [
        'Entra en la página de registro desde el botón «Empezar» de la portada, o directamente en /admin/register.',
        'Escribe el nombre de tu negocio tal y como quieres que lo vean tus clientes (por ejemplo, «Peluquería Aurora»).',
        'Introduce tu correo electrónico y una contraseña segura.',
        'Pulsa «Crear cuenta».',
      ],
      tip: 'El nombre del negocio genera automáticamente la dirección de tu página pública (tu «slug»). Podrás cambiar los datos del negocio más adelante desde Ajustes.',
    },
    en: {
      title: 'Create your account',
      summary: 'Register your business in a minute.',
      intro:
        'The first step is to register your business. All you need is a name, an email and a password.',
      instructions: [
        'Open the sign-up page from the “Get Started” button on the homepage, or go straight to /admin/register.',
        'Enter your business name exactly as you want customers to see it (for example, “Aurora Hair Salon”).',
        'Enter your email address and a strong password.',
        'Click “Create account”.',
      ],
      tip: 'Your business name automatically generates your public page address (your “slug”). You can change your business details later from Settings.',
    },
  },
  {
    slug: 'confirmar-email',
    number: 2,
    screenshot: {
      src: '/img/ayuda/2-panel.png',
      alt: 'Panel de administración al que se llega tras confirmar el correo',
      width: 1600,
      height: 900,
    },
    screenshotEn: {
      src: '/img/ayuda/2-panel-en.png',
      alt: 'The admin panel you reach after confirming your email',
      width: 1600,
      height: 900,
    },
    es: {
      title: 'Confirma tu correo',
      summary: 'Verifica tu email para activar la cuenta.',
      intro:
        'Por seguridad, la cuenta se activa solo cuando confirmas que el correo es tuyo. Es un paso obligatorio.',
      instructions: [
        'Tras registrarte verás una pantalla que te pide revisar tu bandeja de entrada.',
        'Abre el correo que te enviamos desde reservas@xanant.es (revisa también la carpeta de spam si no aparece).',
        'Pulsa el botón o enlace de confirmación del correo.',
        'Al confirmar, entrarás directamente en tu panel de administración con el negocio ya creado.',
      ],
      tip: 'Confirma desde el mismo dispositivo y navegador en el que te registraste. Si el enlace caduca, puedes volver a solicitarlo iniciando sesión.',
    },
    en: {
      title: 'Confirm your email',
      summary: 'Verify your email to activate the account.',
      intro:
        'For security, the account is only activated once you confirm the email is yours. This step is mandatory.',
      instructions: [
        'After signing up you will see a screen asking you to check your inbox.',
        'Open the email we sent from reservas@xanant.es (check the spam folder if you don’t see it).',
        'Click the confirmation button or link in the email.',
        'Once confirmed, you land straight in your admin panel with your business already created.',
      ],
      tip: 'Confirm from the same device and browser you registered on. If the link expires, you can request a new one by signing in.',
    },
  },
  {
    slug: 'servicios',
    number: 3,
    screenshot: {
      src: '/img/ayuda/3-servicios.png',
      alt: 'Formulario para crear un nuevo servicio',
      width: 1600,
      height: 900,
    },
    screenshotEn: {
      src: '/img/ayuda/3-servicios-en.png',
      alt: 'Form to create a new service',
      width: 1600,
      height: 900,
    },
    es: {
      title: 'Añade tus servicios',
      summary: 'Define qué pueden reservar tus clientes.',
      intro:
        'Los servicios son lo que tus clientes reservan. Cada uno tiene un nombre, una duración y un precio.',
      instructions: [
        'En el panel, ve a la sección «Servicios» y pulsa «Nuevo servicio».',
        'Escribe el nombre (por ejemplo, «Corte de pelo»).',
        'Indica la duración en minutos: define cuánto tiempo ocupa en tu agenda.',
        'Fija el precio en euros.',
        'Guarda. Repite para cada servicio que ofrezcas.',
      ],
      tip: 'Puedes activar o desactivar un servicio en cualquier momento. Los servicios desactivados no aparecen en tu página pública, pero no se borran.',
    },
    en: {
      title: 'Add your services',
      summary: 'Define what your customers can book.',
      intro:
        'Services are what your customers book. Each one has a name, a duration and a price.',
      instructions: [
        'In the panel, go to the “Services” section and click “New service”.',
        'Enter the name (for example, “Haircut”).',
        'Set the duration in minutes: this is how much of your agenda it takes up.',
        'Set the price in euros.',
        'Save. Repeat for each service you offer.',
      ],
      tip: 'You can enable or disable a service at any time. Disabled services don’t appear on your public page, but they are not deleted.',
    },
  },
  {
    slug: 'horario',
    number: 4,
    screenshot: {
      src: '/img/ayuda/4-horario.png',
      alt: 'Editor de horario semanal con días activos y tramos horarios',
      width: 1600,
      height: 900,
    },
    screenshotEn: {
      src: '/img/ayuda/4-horario-en.png',
      alt: 'Weekly schedule editor with active days and time ranges',
      width: 1600,
      height: 900,
    },
    es: {
      title: 'Define tu horario',
      summary: 'Marca los días y las horas en que atiendes.',
      intro:
        'El horario determina los huecos que tus clientes podrán reservar. La disponibilidad se calcula automáticamente restando las reservas ya ocupadas.',
      instructions: [
        'Ve a la sección «Horario» del panel.',
        'Activa cada día de la semana en el que trabajas.',
        'Para cada día activo, añade uno o varios tramos horarios (por ejemplo, 09:00–14:00 y 16:00–20:00 para partir el mediodía).',
        'Guarda los cambios.',
      ],
      tip: 'Puedes definir varios tramos por día para reflejar pausas o descansos. La página pública solo mostrará huecos dentro de esos tramos.',
    },
    en: {
      title: 'Set your schedule',
      summary: 'Mark the days and hours you’re open.',
      intro:
        'Your schedule determines the slots customers can book. Availability is calculated automatically by subtracting bookings that are already taken.',
      instructions: [
        'Go to the “Schedule” section of the panel.',
        'Enable each day of the week you work.',
        'For every active day, add one or more time ranges (for example, 09:00–14:00 and 16:00–20:00 to split for lunch).',
        'Save your changes.',
      ],
      tip: 'You can define several ranges per day to reflect breaks. The public page will only show slots within those ranges.',
    },
  },
  {
    slug: 'cobros',
    number: 5,
    screenshot: {
      src: '/img/ayuda/5-cobros.png',
      alt: 'Sección de Ajustes para conectar la cuenta de Stripe',
      width: 1297,
      height: 166,
    },
    screenshotEn: {
      src: '/img/ayuda/5-cobros-en.png',
      alt: 'Settings section to connect the Stripe account',
      width: 1297,
      height: 166,
    },
    es: {
      title: 'Configura los cobros',
      summary: 'Cobro online con tarjeta y/o pago en el centro.',
      intro:
        'Para que se puedan hacer reservas necesitas al menos un método de cobro. Puedes ofrecer pago online con tarjeta, pago en el centro, o ambos.',
      instructions: [
        'Ve a «Ajustes» en el panel.',
        'Para cobrar online, pulsa «Conectar con Stripe» y completa el alta de Stripe Express (te llevará unos minutos y podrás volver cuando quieras).',
        'Si prefieres cobrar en persona, activa la opción «Pago en el centro».',
        'Puedes tener las dos activas: el cliente elegirá al reservar.',
      ],
      tip: 'Con el pago online, el importe llega a tu cuenta de Stripe y la plataforma aplica una pequeña comisión. El pago en el centro no tiene comisión: cobras tú directamente.',
    },
    en: {
      title: 'Set up payments',
      summary: 'Online card payments and/or pay on site.',
      intro:
        'To accept bookings you need at least one payment method. You can offer online card payments, on-site payment, or both.',
      instructions: [
        'Go to “Settings” in the panel.',
        'To charge online, click “Connect with Stripe” and complete the Stripe Express onboarding (it takes a few minutes and you can come back anytime).',
        'If you prefer to charge in person, enable the “Pay on site” option.',
        'You can keep both on: the customer chooses when booking.',
      ],
      tip: 'With online payments the amount reaches your Stripe account and the platform applies a small commission. On-site payment has no commission: you charge directly.',
    },
  },
  {
    slug: 'perfil',
    number: 6,
    screenshot: {
      src: '/img/ayuda/6-perfil.png',
      alt: 'Sección de perfil del negocio: categoría, descripción, ciudad y teléfono',
      width: 448,
      height: 479,
    },
    screenshotEn: {
      src: '/img/ayuda/6-perfil-en.png',
      alt: 'Business profile section: category, description, city and phone',
      width: 448,
      height: 463,
    },
    es: {
      title: 'Completa el perfil',
      summary: 'Categoría, ciudad, descripción y SEO.',
      intro:
        'Un perfil completo genera confianza y ayuda a que te encuentren en buscadores. Todo es opcional, pero recomendable.',
      instructions: [
        'En «Ajustes», elige la categoría de tu negocio (peluquería, clínica, taller…).',
        'Añade ciudad, dirección y teléfono de contacto.',
        'Escribe una breve descripción de lo que ofreces.',
        'Rellena el título y la descripción SEO para mejorar cómo aparece tu página en Google.',
      ],
      tip: 'La categoría y la dirección se publican como datos estructurados (schema.org), lo que ayuda a los buscadores a entender tu negocio.',
    },
    en: {
      title: 'Complete your profile',
      summary: 'Category, city, description and SEO.',
      intro:
        'A complete profile builds trust and helps people find you in search engines. Everything is optional, but recommended.',
      instructions: [
        'In “Settings”, choose your business category (hair salon, clinic, workshop…).',
        'Add your city, address and contact phone.',
        'Write a short description of what you offer.',
        'Fill in the SEO title and description to improve how your page appears on Google.',
      ],
      tip: 'The category and address are published as structured data (schema.org), which helps search engines understand your business.',
    },
  },
  {
    slug: 'compartir',
    number: 7,
    screenshot: {
      src: '/img/ayuda/7-compartir.png',
      alt: 'Página pública de reservas de un negocio, lista para compartir',
      width: 1600,
      height: 900,
    },
    es: {
      title: 'Comparte tu página',
      summary: 'Tu enlace público, listo para recibir reservas.',
      intro:
        'Ya está todo listo. Tu página pública tiene una dirección propia que puedes compartir donde quieras.',
      instructions: [
        'Tu página está en reservas-chanantes.vercel.app/tu-negocio (el nombre corto que se generó al registrarte).',
        'Compártela en Instagram, WhatsApp, Google, tu web o donde estén tus clientes.',
        'Tus clientes eligen servicio, día y hora, y reservan 24/7 sin llamadas.',
        'Recibirás y podrás gestionar las reservas desde la sección «Reservas» del panel.',
      ],
      tip: 'Cada reserva confirmada envía un correo automático al cliente, y (si tu plan lo incluye) un recordatorio el día antes.',
    },
    en: {
      title: 'Share your page',
      summary: 'Your public link, ready to take bookings.',
      intro:
        'Everything is ready. Your public page has its own address that you can share anywhere.',
      instructions: [
        'Your page lives at reservas-chanantes.vercel.app/your-business (the short name generated when you registered).',
        'Share it on Instagram, WhatsApp, Google, your website or wherever your customers are.',
        'Customers choose a service, day and time, and book 24/7 with no phone calls.',
        'You’ll receive and manage bookings from the “Bookings” section of the panel.',
      ],
      tip: 'Every confirmed booking sends an automatic email to the customer and (if your plan includes it) a reminder the day before.',
    },
  },
]

export function getAyudaStep(slug: string): AyudaStep | undefined {
  return AYUDA_STEPS.find((s) => s.slug === slug)
}

export const AYUDA_UI: Record<
  AyudaLang,
  {
    helpCenter: string
    tagline: string
    overview: string
    overviewIntro: string
    stepWord: string
    of: string
    start: string
    next: string
    prev: string
    backHome: string
    tipLabel: string
    onThisPage: string
    ctaTitle: string
    ctaText: string
    ctaButton: string
  }
> = {
  es: {
    helpCenter: 'Centro de ayuda',
    tagline: 'Da de alta tu negocio en 7 pasos',
    overview: 'Introducción',
    overviewIntro:
      'Esta guía te acompaña desde el registro hasta recibir tu primera reserva. Sigue los pasos en orden; cada uno lleva un par de minutos.',
    stepWord: 'Paso',
    of: 'de',
    start: 'Empezar por el paso 1',
    next: 'Siguiente',
    prev: 'Anterior',
    backHome: 'Volver al inicio',
    tipLabel: 'Consejo',
    onThisPage: 'Pasos',
    ctaTitle: '¿List@ para empezar?',
    ctaText: 'Crea tu cuenta gratis y ten tu página de reservas en minutos.',
    ctaButton: 'Crear mi cuenta',
  },
  en: {
    helpCenter: 'Help center',
    tagline: 'Set up your business in 7 steps',
    overview: 'Introduction',
    overviewIntro:
      'This guide walks you from sign-up to your first booking. Follow the steps in order; each one takes a couple of minutes.',
    stepWord: 'Step',
    of: 'of',
    start: 'Start with step 1',
    next: 'Next',
    prev: 'Previous',
    backHome: 'Back to home',
    tipLabel: 'Tip',
    onThisPage: 'Steps',
    ctaTitle: 'Ready to start?',
    ctaText: 'Create your free account and get your booking page in minutes.',
    ctaButton: 'Create my account',
  },
}
