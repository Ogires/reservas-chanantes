import type { TenantRepository } from '../ports/tenant-repository'
import type { StripeConnectService } from '../ports/stripe-connect-service'
import type { Tenant } from '@/domain/entities/tenant'

export class StripeOnboardingUseCase {
  constructor(
    private readonly tenantRepo: TenantRepository,
    private readonly stripeConnect: StripeConnectService
  ) {}

  /**
   * Inicia el onboarding Express: crea la cuenta conectada si el negocio aún
   * no tiene una (y la persiste como no habilitada), y devuelve el enlace de
   * onboarding alojado por Stripe al que redirigir al comercio.
   */
  async startOnboarding(input: {
    tenant: Tenant
    returnUrl: string
    refreshUrl: string
  }): Promise<string> {
    let accountId = input.tenant.stripeAccountId
    if (!accountId) {
      accountId = await this.stripeConnect.createExpressAccount()
      await this.tenantRepo.updateStripeAccount(input.tenant.id, accountId, false)
    }
    return this.stripeConnect.createOnboardingLink(
      accountId,
      input.returnUrl,
      input.refreshUrl
    )
  }

  /**
   * Al volver del onboarding, sincroniza si la cuenta ya puede cobrar
   * (`charges_enabled`) — método documentado por Stripe como alternativa al
   * webhook `account.updated`.
   */
  async refreshStatus(tenant: Tenant): Promise<void> {
    if (!tenant.stripeAccountId) return
    const chargesEnabled = await this.stripeConnect.isChargesEnabled(
      tenant.stripeAccountId
    )
    await this.tenantRepo.updateStripeAccount(
      tenant.id,
      tenant.stripeAccountId,
      chargesEnabled
    )
  }
}
