import { describe, it, expect } from 'vitest'
import { PLAN_LIMITS, getCommissionRateBps } from './plan-limits'
import { TenantPlan } from '../types'

describe('plan-limits', () => {
  it('FREE: 3 servicios, 50 reservas/mes, sin recordatorios, 5 % de comisión', () => {
    expect(PLAN_LIMITS[TenantPlan.FREE]).toEqual({
      maxActiveServices: 3,
      maxBookingsPerMonth: 50,
      emailReminders: false,
      commissionRateBps: 500,
    })
  })

  it('PRO: ilimitado, con recordatorios, 1 % de comisión', () => {
    const pro = PLAN_LIMITS[TenantPlan.PRO]
    expect(pro.maxActiveServices).toBe(Infinity)
    expect(pro.maxBookingsPerMonth).toBe(Infinity)
    expect(pro.emailReminders).toBe(true)
    expect(pro.commissionRateBps).toBe(100)
  })

  it('getCommissionRateBps devuelve la tasa en puntos básicos por plan', () => {
    expect(getCommissionRateBps(TenantPlan.FREE)).toBe(500)
    expect(getCommissionRateBps(TenantPlan.PRO)).toBe(100)
  })
})
