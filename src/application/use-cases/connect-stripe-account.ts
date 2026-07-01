import type { TenantRepository } from '../ports/tenant-repository'
import type { StripeConnectService } from '../ports/stripe-connect-service'

export interface ConnectStripeAccountInput {
  tenantId: string
  code: string
}

export class ConnectStripeAccountUseCase {
  constructor(
    private readonly tenantRepo: TenantRepository,
    private readonly stripeConnect: StripeConnectService
  ) {}

  async execute(input: ConnectStripeAccountInput): Promise<void> {
    const response = await this.stripeConnect.exchangeOAuthCode(input.code)
    // Determinamos si la cuenta ya puede cobrar en el momento de conectar
    // (retrieve de charges_enabled), en lugar de esperar al webhook
    // account.updated — método documentado por Stripe y válido en Accounts v2.
    const chargesEnabled = await this.stripeConnect.isChargesEnabled(
      response.stripeUserId
    )
    await this.tenantRepo.updateStripeAccount(
      input.tenantId,
      response.stripeUserId,
      chargesEnabled
    )
  }
}
