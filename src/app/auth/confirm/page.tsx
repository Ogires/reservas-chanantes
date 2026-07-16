import type { Metadata } from 'next'
import Link from 'next/link'
import type { Locale } from '@/domain/types'

// Página intermedia de confirmación de email. Existe para NO ejecutar el
// verifyOtp en un GET que los clientes de correo / escáneres de seguridad
// pre-visitan (gastarían el token de un solo uso). Aquí no se verifica nada:
// solo se muestra un botón que hace el POST a /api/auth/confirm. Un bot no
// envía formularios, así que el token sobrevive hasta el clic humano.

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

interface Strings {
  heading: string
  intro: string
  cta: Record<string, string>
  invalid: string
  backHome: string
}

const STRINGS: Record<Locale, Strings> = {
  'es-ES': {
    heading: 'Un último paso',
    intro: 'Por tu seguridad, confirma la acción pulsando el botón.',
    cta: {
      signup: 'Confirmar mi cuenta',
      recovery: 'Cambiar contraseña',
      email_change: 'Confirmar email',
      magiclink: 'Iniciar sesión',
      invite: 'Aceptar invitación',
      email: 'Continuar',
    },
    invalid:
      'Este enlace no es válido o está incompleto. Solicita uno nuevo desde la página de acceso.',
    backHome: 'Volver al inicio',
  },
  'en-US': {
    heading: 'One last step',
    intro: 'For your security, confirm the action by clicking the button.',
    cta: {
      signup: 'Confirm my account',
      recovery: 'Change password',
      email_change: 'Confirm email',
      magiclink: 'Sign in',
      invite: 'Accept invitation',
      email: 'Continue',
    },
    invalid:
      'This link is invalid or incomplete. Request a new one from the sign-in page.',
    backHome: 'Back to home',
  },
}

function resolveLang(raw?: string): Locale {
  return raw?.toLowerCase().startsWith('en') ? 'en-US' : 'es-ES'
}

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{
    token_hash?: string
    type?: string
    next?: string
    lang?: string
  }>
}) {
  const sp = await searchParams
  const lang = resolveLang(sp.lang)
  const s = STRINGS[lang]
  const tokenHash = sp.token_hash ?? ''
  const type = sp.type ?? ''
  const next = sp.next ?? ''
  const label = s.cta[type] ?? s.cta.email
  const valid = Boolean(tokenHash && type)

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#FDFBF9] to-[#F5F0EB] px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link href="/" className="text-lg font-bold font-serif text-slate-900 hover:text-teal-700 transition-colors">Reservas Chanantes</Link>
        </div>
        <div className="rounded-2xl border border-warm-border bg-white p-8 shadow-lg text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-3">{s.heading}</h1>
          {valid ? (
            <>
              <p className="text-slate-600 mb-6">{s.intro}</p>
              <form method="post" action="/api/auth/confirm">
                <input type="hidden" name="token_hash" value={tokenHash} />
                <input type="hidden" name="type" value={type} />
                <input type="hidden" name="next" value={next} />
                <input type="hidden" name="lang" value={lang} />
                <button
                  type="submit"
                  className="w-full rounded-lg bg-teal-600 px-4 py-2.5 font-medium text-white shadow-sm hover:bg-teal-700 transition-colors"
                >
                  {label}
                </button>
              </form>
            </>
          ) : (
            <>
              <p className="text-slate-600 mb-4">{s.invalid}</p>
              <Link href="/" className="text-teal-600 hover:text-teal-700 font-medium transition-colors">
                {s.backHome}
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
