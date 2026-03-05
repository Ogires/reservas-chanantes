import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/infrastructure/supabase/server'
import { SupabaseTenantRepository } from '@/infrastructure/supabase/tenant-repository'
import { StripeConnectServiceImpl } from '@/infrastructure/stripe/stripe-connect-service'
import { ConnectStripeAccountUseCase } from '@/application/use-cases/connect-stripe-account'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(
      `${url.origin}/admin/settings?stripe_error=${error ?? 'missing_code'}`
    )
  }

  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${url.origin}/admin/login`)
  }

  const tenantRepo = new SupabaseTenantRepository(supabase)
  const tenant = await tenantRepo.findByOwnerId(user.id)

  if (!tenant) {
    return NextResponse.redirect(`${url.origin}/admin/register`)
  }

  try {
    const connectService = new StripeConnectServiceImpl()
    const useCase = new ConnectStripeAccountUseCase(tenantRepo, connectService)
    await useCase.execute({ tenantId: tenant.id, code })

    return NextResponse.redirect(
      `${url.origin}/admin/settings?stripe_connected=true`
    )
  } catch (err) {
    console.error('[stripe-connect-callback]', err)
    return NextResponse.redirect(
      `${url.origin}/admin/settings?stripe_error=connection_failed`
    )
  }
}
