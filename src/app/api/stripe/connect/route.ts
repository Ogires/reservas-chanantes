import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/infrastructure/supabase/server'
import { SupabaseTenantRepository } from '@/infrastructure/supabase/tenant-repository'
import { StripeConnectServiceImpl } from '@/infrastructure/stripe/stripe-connect-service'

export async function GET(request: Request) {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tenantRepo = new SupabaseTenantRepository(supabase)
  const tenant = await tenantRepo.findByOwnerId(user.id)

  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
  }

  const url = new URL(request.url)
  const redirectUri = `${url.origin}/api/stripe/connect/callback`

  const connectService = new StripeConnectServiceImpl()
  const oauthUrl = connectService.createOAuthLink(tenant.id, redirectUri)

  return NextResponse.redirect(oauthUrl)
}
