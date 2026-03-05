import { TenantPlan } from '../types'

export const PLAN_LIMITS = {
  [TenantPlan.FREE]: {
    maxActiveServices: 3,
    maxBookingsPerMonth: 50,
    emailReminders: false,
    commissionRateBps: 500, // 5%
  },
  [TenantPlan.PRO]: {
    maxActiveServices: Infinity,
    maxBookingsPerMonth: Infinity,
    emailReminders: true,
    commissionRateBps: 100, // 1%
  },
} as const

export function getCommissionRateBps(plan: TenantPlan): number {
  return PLAN_LIMITS[plan].commissionRateBps
}
