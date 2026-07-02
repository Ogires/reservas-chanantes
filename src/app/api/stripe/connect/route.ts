import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/infrastructure/supabase/server'
import { SupabaseTenantRepository } from '@/infrastructure/supabase/tenant-repository'
import { StripeConnectServiceImpl } from '@/infrastructure/stripe/stripe-connect-service'
import { StripeOnboardingUseCase } from '@/application/use-cases/stripe-onboarding'

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
    const onboardingUrl = await useCase.startOnboarding({
      tenant,
      returnUrl: `${url.origin}/api/stripe/connect/callback`,
      refreshUrl: `${url.origin}/api/stripe/connect`,
    })
    return NextResponse.redirect(onboardingUrl)
  } catch (err) {
    console.error('[stripe-connect]', err)
    return NextResponse.redirect(
      `${url.origin}/admin/settings?stripe_error=onboarding_failed`
    )
  }
}
