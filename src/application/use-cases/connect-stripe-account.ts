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
    await this.tenantRepo.updateStripeAccount(
      input.tenantId,
      response.stripeUserId,
      false
    )
  }
}
