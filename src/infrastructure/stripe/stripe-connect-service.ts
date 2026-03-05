import type {
  StripeConnectService,
  OAuthExchangeResult,
} from '@/application/ports/stripe-connect-service'
import { getStripe } from './client'

export class StripeConnectServiceImpl implements StripeConnectService {
  async exchangeOAuthCode(code: string): Promise<OAuthExchangeResult> {
    const response = await getStripe().oauth.token({
      code,
      grant_type: 'authorization_code',
    })
    if (!response.stripe_user_id) {
      throw new Error('Stripe OAuth did not return a user ID')
    }
    return { stripeUserId: response.stripe_user_id }
  }

  createOAuthLink(tenantId: string, redirectUri: string): string {
    return getStripe().oauth.authorizeUrl({
      response_type: 'code',
      client_id: process.env.STRIPE_CONNECT_CLIENT_ID!,
      scope: 'read_write',
      state: tenantId,
      redirect_uri: redirectUri,
    })
  }

  async createLoginLink(stripeAccountId: string): Promise<string> {
    const link = await getStripe().accounts.createLoginLink(stripeAccountId)
    return link.url
  }
}
