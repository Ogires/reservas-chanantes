import type { Money } from '../value-objects/money'

export interface Service {
  readonly id: string
  readonly tenantId: string
  readonly name: string
  readonly durationMinutes: number
  readonly price: Money
  readonly active: boolean
}
