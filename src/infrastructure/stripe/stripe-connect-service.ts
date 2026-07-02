import type { StripeConnectService } from '@/application/ports/stripe-connect-service'
import { getStripe } from './client'

export class StripeConnectServiceImpl implements StripeConnectService {
  async createExpressAccount(): Promise<string> {
    const account = await getStripe().accounts.create({
      type: 'express',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    })
    return account.id
  }

  async createOnboardingLink(
    stripeAccountId: string,
    returnUrl: string,
    refreshUrl: string
  ): Promise<string> {
    const link = await getStripe().accountLinks.create({
      account: stripeAccountId,
      return_url: returnUrl,
      refresh_url: refreshUrl,
      type: 'account_onboarding',
    })
    return link.url
  }

  async createLoginLink(stripeAccountId: string): Promise<string> {
    const link = await getStripe().accounts.createLoginLink(stripeAccountId)
    return link.url
  }

  async isChargesEnabled(stripeAccountId: string): Promise<boolean> {
    const account = await getStripe().accounts.retrieve(stripeAccountId)
    return account.charges_enabled ?? false
  }
}
