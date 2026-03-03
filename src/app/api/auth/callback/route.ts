import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next')

  const isCustomerFlow = next === 'my'

  if (!code) {
    const loginUrl = isCustomerFlow ? '/my/login?error=auth' : '/admin/login?error=auth'
    return NextResponse.redirect(new URL(loginUrl, origin))
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { error, data } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    const loginUrl = isCustomerFlow ? '/my/login?error=auth' : '/admin/login?error=auth'
    return NextResponse.redirect(new URL(loginUrl, origin))
  }

  // Customer flow: link by email if customer exists, then redirect to portal
  if (isCustomerFlow) {
    const userId = data.user?.id
    const email = data.user?.email
    if (userId && email) {
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id, auth_user_id')
        .eq('email', email)
        .single()

      if (existingCustomer && !existingCustomer.auth_user_id) {
        await supabase
          .from('customers')
          .update({ auth_user_id: userId })
          .eq('id', existingCustomer.id)
      }
    }
    return NextResponse.redirect(new URL('/my', origin))
  }

  // Admin flow: check if user already has a tenant — if not, send to register
  const userId = data.user?.id
  if (userId) {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('owner_id', userId)
      .single()

    if (!tenant) {
      return NextResponse.redirect(new URL('/admin/register', origin))
    }
  }

  return NextResponse.redirect(new URL('/admin/dashboard', origin))
}
