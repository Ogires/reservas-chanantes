import { NextRequest, NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createSupabaseServer } from '@/infrastructure/supabase/server'
import { createSupabaseAdmin } from '@/infrastructure/supabase/admin-client'
import { provisionTenant } from '@/infrastructure/supabase/provision-tenant'

/**
 * Confirmación de email por token_hash + verifyOtp.
 *
 * El GET NO consume el token: los clientes de correo y los escáneres de
 * seguridad (Gmail, Safe Links, antivirus corporativos) pre-visitan los enlaces
 * y gastarían el OTP de un solo uso antes de que el usuario haga clic. Por eso
 * el GET solo reenvía a la página `/auth/confirm`, que muestra un botón; el
 * token se verifica en el POST que origina ese botón (un bot no envía
 * formularios). A diferencia del callback OAuth (que intercambia un `code` con
 * PKCE), verifyOtp funciona aunque el enlace se abra en otro navegador. Al
 * confirmar: crea el negocio (flujo admin) o vincula el cliente (flujo /my).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const page = new URL('/auth/confirm', origin)
  for (const key of ['token_hash', 'type', 'next', 'lang'] as const) {
    const value = searchParams.get(key)
    if (value) page.searchParams.set(key, value)
  }
  return NextResponse.redirect(page)
}

export async function POST(request: NextRequest) {
  const { origin } = request.nextUrl
  const form = await request.formData()
  const tokenHash = form.get('token_hash')?.toString() || null
  const type = (form.get('type')?.toString() || null) as EmailOtpType | null
  const nextParam = form.get('next')?.toString() || '/admin/dashboard'

  // `next` puede llegar como ruta o como URL absoluta (emailRedirectTo).
  let nextPath = '/admin/dashboard'
  try {
    nextPath = nextParam.startsWith('/') ? nextParam : new URL(nextParam).pathname
  } catch {
    nextPath = '/admin/dashboard'
  }
  const isCustomerFlow = nextPath.startsWith('/my')
  const loginUrl = isCustomerFlow
    ? '/my/login?error=auth'
    : '/admin/login?error=auth'

  // 303: tras un POST, el navegador debe hacer GET del destino (no repetir POST).
  const redirect = (path: string) =>
    NextResponse.redirect(new URL(path, origin), 303)

  if (!tokenHash || !type) {
    return redirect(loginUrl)
  }

  const supabase = await createSupabaseServer()
  const { error, data } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  })

  if (error || !data.user) {
    return redirect(loginUrl)
  }

  const user = data.user

  // Solo el registro (signup) crea/vincula el recurso del usuario. Para
  // recovery, email_change, magiclink, etc. basta con verificar la sesión y
  // redirigir a `next` (p. ej. la página de reset de contraseña).
  if (type === 'signup') {
    if (isCustomerFlow) {
      if (user.email) {
        // Enlace del cliente por email vía service-role: la fila puede estar
        // aún sin enlazar (auth_user_id NULL), que la RLS "self" no dejaría
        // leer/actualizar. Operación de servidor de confianza (OTP verificado).
        const admin = createSupabaseAdmin()
        const { data: existingCustomer } = await admin
          .from('customers')
          .select('id, auth_user_id')
          .eq('email', user.email)
          .single()

        if (existingCustomer && !existingCustomer.auth_user_id) {
          await admin
            .from('customers')
            .update({ auth_user_id: user.id })
            .eq('id', existingCustomer.id)
        }
      }
    } else {
      // Flujo de negocio: crear el tenant (si no existe) desde el business_name
      // guardado en los metadatos durante el registro.
      const businessName = (
        user.user_metadata?.business_name as string | undefined
      )?.trim()

      if (businessName) {
        try {
          await provisionTenant(supabase, user.id, businessName)
        } catch {
          return redirect('/admin/register?error=provision')
        }
      }
    }
  }

  return redirect(nextPath)
}
