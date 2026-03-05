import { describe, it, expect, vi } from 'vitest'
import { LinkCustomerAuthUseCase } from './link-customer-auth'
import type { CustomerRepository } from '../ports/customer-repository'
import type { Customer } from '@/domain/entities/customer'
import { CustomerNotFoundError } from '@/domain/errors/domain-errors'

const CUSTOMER: Customer = {
  id: 'customer-1',
  name: 'Ana García',
  email: 'ana@example.com',
  phone: '600123456',
}

function createMockRepo(overrides?: {
  byAuthUserId?: Customer | null
  byEmail?: Customer | null
}): CustomerRepository {
  return {
    findById: async () => null,
    findByEmail: async () =>
      overrides?.byEmail !== undefined ? overrides.byEmail : CUSTOMER,
    findByAuthUserId: async () => overrides?.byAuthUserId ?? null,
    save: async (c) => c,
    update: async (c) => c,
  }
}

describe('LinkCustomerAuthUseCase', () => {
  it('links auth user to existing customer by email', async () => {
    const repo = createMockRepo()
    const updateSpy = vi.spyOn(repo, 'update')
    const useCase = new LinkCustomerAuthUseCase(repo)

    const result = await useCase.execute({
      authUserId: 'auth-1',
      email: 'ana@example.com',
    })

    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ authUserId: 'auth-1' })
    )
    expect(result.authUserId).toBe('auth-1')
  })

  it('returns existing customer when already linked', async () => {
    const linked: Customer = { ...CUSTOMER, authUserId: 'auth-1' }
    const repo = createMockRepo({ byAuthUserId: linked })
    const updateSpy = vi.spyOn(repo, 'update')
    const useCase = new LinkCustomerAuthUseCase(repo)

    const result = await useCase.execute({
      authUserId: 'auth-1',
      email: 'ana@example.com',
    })

    expect(updateSpy).not.toHaveBeenCalled()
    expect(result.id).toBe('customer-1')
  })

  it('throws CustomerNotFoundError when no customer with email', async () => {
    const repo = createMockRepo({ byEmail: null })
    const useCase = new LinkCustomerAuthUseCase(repo)

    await expect(
      useCase.execute({ authUserId: 'auth-1', email: 'unknown@example.com' })
    ).rejects.toThrow(CustomerNotFoundError)
  })

  it('does not modify email when linking', async () => {
    const repo = createMockRepo()
    const updateSpy = vi.spyOn(repo, 'update')
    const useCase = new LinkCustomerAuthUseCase(repo)

    await useCase.execute({
      authUserId: 'auth-1',
      email: 'ana@example.com',
    })

    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'ana@example.com' })
    )
  })

  it('preserves all existing customer fields when linking', async () => {
    const repo = createMockRepo()
    const updateSpy = vi.spyOn(repo, 'update')
    const useCase = new LinkCustomerAuthUseCase(repo)

    await useCase.execute({
      authUserId: 'auth-1',
      email: 'ana@example.com',
    })

    expect(updateSpy).toHaveBeenCalledWith({
      id: 'customer-1',
      name: 'Ana García',
      email: 'ana@example.com',
      phone: '600123456',
      authUserId: 'auth-1',
    })
  })
})
