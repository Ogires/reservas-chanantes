import { describe, it, expect, vi, beforeEach } from 'vitest'

const accounts = {
  create: vi.fn(),
  createLoginLink: vi.fn(),
  retrieve: vi.fn(),
}
const accountLinks = { create: vi.fn() }

vi.mock('./client', () => ({
  getStripe: () => ({ accounts, accountLinks }),
}))

import { StripeConnectServiceImpl } from './stripe-connect-service'

describe('StripeConnectServiceImpl', () => {
  const svc = new StripeConnectServiceImpl()
  beforeEach(() => vi.clearAllMocks())

  it('createExpressAccount crea una cuenta Express y devuelve su id', async () => {
    accounts.create.mockResolvedValue({ id: 'acct_1' })
    expect(await svc.createExpressAccount()).toBe('acct_1')
    expect(accounts.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'express' })
    )
  })

  it('createOnboardingLink genera el account link y devuelve la url', async () => {
    accountLinks.create.mockResolvedValue({ url: 'https://onboard' })
    const url = await svc.createOnboardingLink('acct_1', 'https://ret', 'https://ref')
    expect(url).toBe('https://onboard')
    expect(accountLinks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        account: 'acct_1',
        type: 'account_onboarding',
        return_url: 'https://ret',
        refresh_url: 'https://ref',
      })
    )
  })

  it('createLoginLink devuelve la url del panel', async () => {
    accounts.createLoginLink.mockResolvedValue({ url: 'https://login' })
    expect(await svc.createLoginLink('acct_1')).toBe('https://login')
  })

  it('isChargesEnabled refleja charges_enabled (true/false/undefined)', async () => {
    accounts.retrieve.mockResolvedValue({ charges_enabled: true })
    expect(await svc.isChargesEnabled('acct_1')).toBe(true)

    accounts.retrieve.mockResolvedValue({ charges_enabled: false })
    expect(await svc.isChargesEnabled('acct_1')).toBe(false)

    accounts.retrieve.mockResolvedValue({})
    expect(await svc.isChargesEnabled('acct_1')).toBe(false)
  })
})
