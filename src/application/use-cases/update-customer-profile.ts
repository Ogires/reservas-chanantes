import type { CustomerRepository } from '../ports/customer-repository'
import type { Customer } from '@/domain/entities/customer'
import type { Locale } from '@/domain/types'
import {
  CustomerNotFoundError,
  InvalidPhoneError,
} from '@/domain/errors/domain-errors'

export interface UpdateCustomerProfileInput {
  authUserId: string
  name: string
  phone: string
  preferredLocale?: Locale
}

export class UpdateCustomerProfileUseCase {
  constructor(private readonly customerRepo: CustomerRepository) {}

  async execute(input: UpdateCustomerProfileInput): Promise<Customer> {
    const customer = await this.customerRepo.findByAuthUserId(input.authUserId)
    if (!customer) throw new CustomerNotFoundError(input.authUserId)

    const phoneDigits = input.phone.replace(/\D/g, '')
    if (phoneDigits.length < 6) {
      throw new InvalidPhoneError(input.phone)
    }

    return this.customerRepo.update({
      ...customer,
      name: input.name,
      phone: input.phone,
      preferredLocale: input.preferredLocale,
    })
  }
}
