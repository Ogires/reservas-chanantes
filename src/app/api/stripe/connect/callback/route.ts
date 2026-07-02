import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/infrastructure/supabase/server'
import { SupabaseTenantRepository } from '@/infrastructure/supabase/tenant-repository'
import { StripeConnectServiceImpl } from '@/infrastructure/stripe/stripe-connect-service'
import { StripeOnboardingUseCase } from '@/application/use-cases/stripe-onboarding'

// return_url del onboarding Express: no hay `code` que intercambiar; solo
// sincronizamos si la cuenta ya puede cobrar (charges_enabled).
export async function GET(request: Request) {
  const url = new URL(request.url)
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
    const useCase = new StripeOnboardingUseCase(
      tenantRepo,
      new StripeConnectServiceImpl()
    )
    await useCase.refreshStatus(tenant)
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
