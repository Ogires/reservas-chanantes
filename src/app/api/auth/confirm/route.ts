import { NextRequest, NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createSupabaseServer } from '@/infrastructure/supabase/server'
import { createSupabaseAdmin } from '@/infrastructure/supabase/admin-client'
import { provisionTenant } from '@/infrastructure/supabase/provision-tenant'

/**
 * Destino de los enlaces de confirmación de email (token_hash + verifyOtp).
 * A diferencia del callback OAuth (que intercambia un `code` con PKCE), este
 * verifica el OTP directamente, por lo que funciona aunque el enlace se abra en
 * otro navegador. Al confirmar: crea el negocio (flujo admin) o vincula el
 * cliente (flujo /my), y redirige a `next`.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const nextParam = searchParams.get('next') ?? '/admin/dashboard'

  // `next` puede llegar como ruta o como URL absoluta (emailRedirectTo).
  let nextPath = '/admin/dashboard'
  try {
    nextPath = nextParam.startsWith('/')
      ? nextParam
      : new URL(nextParam).pathname
  } catch {
    nextPath = '/admin/dashboard'
  }
  const isCustomerFlow = nextPath.startsWith('/my')
  const loginUrl = isCustomerFlow
    ? '/my/login?error=auth'
    : '/admin/login?error=auth'

  if (!tokenHash || !type) {
    return NextResponse.redirect(new URL(loginUrl, origin))
  }

  const supabase = await createSupabaseServer()
  const { error, data } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  })

  if (error || !data.user) {
    return NextResponse.redirect(new URL(loginUrl, origin))
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
          return NextResponse.redirect(
            new URL('/admin/register?error=provision', origin)
          )
        }
      }
    }
  }

  return NextResponse.redirect(new URL(nextPath, origin))
}
