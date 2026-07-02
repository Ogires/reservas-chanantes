export interface StripeConnectService {
  /** Crea una cuenta conectada Express y devuelve su id (`acct_…`). */
  createExpressAccount(): Promise<string>
  /** Genera un enlace de onboarding alojado por Stripe (un solo uso). */
  createOnboardingLink(
    stripeAccountId: string,
    returnUrl: string,
    refreshUrl: string
  ): Promise<string>
  /** Enlace al panel Express de la cuenta conectada. */
  createLoginLink(stripeAccountId: string): Promise<string>
  /** Si la cuenta conectada ya puede aceptar cobros (`charges_enabled`). */
  isChargesEnabled(stripeAccountId: string): Promise<boolean>
}
