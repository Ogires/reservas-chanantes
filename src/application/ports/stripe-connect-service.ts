export interface OAuthExchangeResult {
  stripeUserId: string
}

export interface StripeConnectService {
  exchangeOAuthCode(code: string): Promise<OAuthExchangeResult>
  createOAuthLink(tenantId: string, redirectUri: string): string
  createLoginLink(stripeAccountId: string): Promise<string>
  /** Si la cuenta conectada ya puede aceptar cobros (charges_enabled). */
  isChargesEnabled(stripeAccountId: string): Promise<boolean>
}
