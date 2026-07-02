import { describe, it, expect, vi } from 'vitest'
import { StripeOnboardingUseCase } from './stripe-onboarding'
import type { TenantRepository } from '../ports/tenant-repository'
import type { StripeConnectService } from '../ports/stripe-connect-service'
import type { Tenant } from '@/domain/entities/tenant'

function makeTenant(overrides: Partial<Tenant> = {}): Tenant {
  return {
    id: 't-1',
    stripeAccountId: undefined,
    stripeAccountEnabled: false,
    ...overrides,
  } as unknown as Tenant
}

function makeStripeConnect(
  overrides: Partial<StripeConnectService> = {}
): StripeConnectService {
  return {
    createExpressAccount: vi.fn().mockResolvedValue('acct_new'),
    createOnboardingLink: vi
      .fn()
      .mockResolvedValue('https://connect.stripe.com/onboard/link'),
    createLoginLink: vi.fn(),
    isChargesEnabled: vi.fn().mockResolvedValue(true),
    ...overrides,
  }
}

function makeTenantRepo() {
  return {
    updateStripeAccount: vi.fn().mockResolvedValue(undefined),
  } as unknown as TenantRepository
}

describe('StripeOnboardingUseCase.startOnboarding', () => {
  it('crea una cuenta Express y la persiste cuando el negocio no tiene una', async () => {
    const tenantRepo = makeTenantRepo()
    const stripeConnect = makeStripeConnect()
    const useCase = new StripeOnboardingUseCase(tenantRepo, stripeConnect)

    const url = await useCase.startOnboarding({
      tenant: makeTenant({ stripeAccountId: undefined }),
      returnUrl: 'https://app/return',
      refreshUrl: 'https://app/refresh',
    })

    expect(stripeConnect.createExpressAccount).toHaveBeenCalledOnce()
    expect(tenantRepo.updateStripeAccount).toHaveBeenCalledWith(
      't-1',
      'acct_new',
      false
    )
    expect(stripeConnect.createOnboardingLink).toHaveBeenCalledWith(
      'acct_new',
      'https://app/return',
      'https://app/refresh'
    )
    expect(url).toBe('https://connect.stripe.com/onboard/link')
  })

  it('reutiliza la cuenta existente sin crear una nueva', async () => {
    const tenantRepo = makeTenantRepo()
    const stripeConnect = makeStripeConnect()
    const useCase = new StripeOnboardingUseCase(tenantRepo, stripeConnect)

    await useCase.startOnboarding({
      tenant: makeTenant({ stripeAccountId: 'acct_existing' }),
      returnUrl: 'https://app/return',
      refreshUrl: 'https://app/refresh',
    })

    expect(stripeConnect.createExpressAccount).not.toHaveBeenCalled()
    expect(tenantRepo.updateStripeAccount).not.toHaveBeenCalled()
    expect(stripeConnect.createOnboardingLink).toHaveBeenCalledWith(
      'acct_existing',
      'https://app/return',
      'https://app/refresh'
    )
  })
})

describe('StripeOnboardingUseCase.refreshStatus', () => {
  it('marca la cuenta como habilitada cuando charges_enabled es true', async () => {
    const tenantRepo = makeTenantRepo()
    const stripeConnect = makeStripeConnect({
      isChargesEnabled: vi.fn().mockResolvedValue(true),
    })
    const useCase = new StripeOnboardingUseCase(tenantRepo, stripeConnect)

    await useCase.refreshStatus(makeTenant({ stripeAccountId: 'acct_x' }))

    expect(tenantRepo.updateStripeAccount).toHaveBeenCalledWith(
      't-1',
      'acct_x',
      true
    )
  })

  it('marca la cuenta como NO habilitada cuando charges_enabled es false', async () => {
    const tenantRepo = makeTenantRepo()
    const stripeConnect = makeStripeConnect({
      isChargesEnabled: vi.fn().mockResolvedValue(false),
    })
    const useCase = new StripeOnboardingUseCase(tenantRepo, stripeConnect)

    await useCase.refreshStatus(makeTenant({ stripeAccountId: 'acct_x' }))

    expect(tenantRepo.updateStripeAccount).toHaveBeenCalledWith(
      't-1',
      'acct_x',
      false
    )
  })

  it('no hace nada si el negocio no tiene cuenta conectada', async () => {
    const tenantRepo = makeTenantRepo()
    const stripeConnect = makeStripeConnect()
    const useCase = new StripeOnboardingUseCase(tenantRepo, stripeConnect)

    await useCase.refreshStatus(makeTenant({ stripeAccountId: undefined }))

    expect(stripeConnect.isChargesEnabled).not.toHaveBeenCalled()
    expect(tenantRepo.updateStripeAccount).not.toHaveBeenCalled()
  })
})
