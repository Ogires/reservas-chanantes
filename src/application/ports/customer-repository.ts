import type { Customer } from '@/domain/entities/customer'

export interface CustomerRepository {
  findByEmail(email: string): Promise<Customer | null>
  save(customer: Customer): Promise<Customer>
}
