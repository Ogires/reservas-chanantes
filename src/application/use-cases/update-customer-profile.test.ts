import { describe, it, expect, vi } from 'vitest'
import { UpdateCustomerProfileUseCase } from './update-customer-profile'
import type { CustomerRepository } from '../ports/customer-repository'
import type { Customer } from '@/domain/entities/customer'
import {
  CustomerNotFoundError,
  InvalidPhoneError,
} from '@/domain/errors/domain-errors'

const CUSTOMER: Customer = {
  id: 'customer-1',
  name: 'Ana García',
  email: 'ana@example.com',
  phone: '600123456',
  authUserId: 'auth-1',
}

function createMockRepo(overrides?: {
  customer?: Customer | null
}): CustomerRepository {
  return {
    findById: async () => null,
    findByEmail: async () => null,
    findByAuthUserId: async () =>
      overrides?.customer !== undefined ? overrides.customer : CUSTOMER,
    save: async (c) => c,
    update: async (c) => c,
  }
}

describe('UpdateCustomerProfileUseCase', () => {
  it('updates name, phone and locale', async () => {
    const repo = createMockRepo()
    const updateSpy = vi.spyOn(repo, 'update')
    const useCase = new UpdateCustomerProfileUseCase(repo)

    const result = await useCase.execute({
      authUserId: 'auth-1',
      name: 'Ana Updated',
      phone: '700111222',
      preferredLocale: 'en-US',
    })

    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Ana Updated',
        phone: '700111222',
        preferredLocale: 'en-US',
      })
    )
    expect(result.name).toBe('Ana Updated')
  })

  it('throws CustomerNotFoundError for unknown auth user', async () => {
    const repo = createMockRepo({ customer: null })
    const useCase = new UpdateCustomerProfileUseCase(repo)

    await expect(
      useCase.execute({
        authUserId: 'unknown',
        name: 'Test',
        phone: '600123456',
      })
    ).rejects.toThrow(CustomerNotFoundError)
  })

  it('throws InvalidPhoneError for invalid phone', async () => {
    const repo = createMockRepo()
    const useCase = new UpdateCustomerProfileUseCase(repo)

    await expect(
      useCase.execute({
        authUserId: 'auth-1',
        name: 'Ana',
        phone: '123',
      })
    ).rejects.toThrow(InvalidPhoneError)
  })

  it('preserves email when updating', async () => {
    const repo = createMockRepo()
    const updateSpy = vi.spyOn(repo, 'update')
    const useCase = new UpdateCustomerProfileUseCase(repo)

    await useCase.execute({
      authUserId: 'auth-1',
      name: 'New Name',
      phone: '600123456',
    })

    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'ana@example.com' })
    )
  })

  it('allows updating without preferredLocale', async () => {
    const repo = createMockRepo()
    const updateSpy = vi.spyOn(repo, 'update')
    const useCase = new UpdateCustomerProfileUseCase(repo)

    await useCase.execute({
      authUserId: 'auth-1',
      name: 'Ana',
      phone: '600123456',
    })

    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ preferredLocale: undefined })
    )
  })

  it('preserves authUserId when updating', async () => {
    const repo = createMockRepo()
    const updateSpy = vi.spyOn(repo, 'update')
    const useCase = new UpdateCustomerProfileUseCase(repo)

    await useCase.execute({
      authUserId: 'auth-1',
      name: 'New Name',
      phone: '600123456',
    })

    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ authUserId: 'auth-1' })
    )
  })
})
