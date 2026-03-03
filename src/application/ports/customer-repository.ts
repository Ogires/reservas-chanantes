import type { Customer } from '@/domain/entities/customer'

export interface CustomerRepository {
  findById(id: string): Promise<Customer | null>
  findByEmail(email: string): Promise<Customer | null>
  findByAuthUserId(authUserId: string): Promise<Customer | null>
  save(customer: Customer): Promise<Customer>
  update(customer: Customer): Promise<Customer>
}
