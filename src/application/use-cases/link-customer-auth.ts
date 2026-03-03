import type { CustomerRepository } from '../ports/customer-repository'
import type { Customer } from '@/domain/entities/customer'
import { CustomerNotFoundError } from '@/domain/errors/domain-errors'

export interface LinkCustomerAuthInput {
  authUserId: string
  email: string
}

export class LinkCustomerAuthUseCase {
  constructor(private readonly customerRepo: CustomerRepository) {}

  async execute(input: LinkCustomerAuthInput): Promise<Customer> {
    // Check if already linked
    const existing = await this.customerRepo.findByAuthUserId(input.authUserId)
    if (existing) return existing

    // Find customer by email
    const customer = await this.customerRepo.findByEmail(input.email)
    if (!customer) throw new CustomerNotFoundError(input.email)

    // Link auth user to customer
    return this.customerRepo.update({
      ...customer,
      authUserId: input.authUserId,
    })
  }
}
