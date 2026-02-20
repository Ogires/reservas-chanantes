import type { SupabaseClient } from '@supabase/supabase-js'
import { SupabaseTenantRepository } from './tenant-repository'
import { SupabaseServiceRepository } from './service-repository'
import { SupabaseScheduleRepository } from './schedule-repository'
import { SupabaseBookingRepository } from './booking-repository'
import { SupabaseCustomerRepository } from './customer-repository'

export function createRepositories(supabase: SupabaseClient) {
  return {
    tenantRepo: new SupabaseTenantRepository(supabase),
    serviceRepo: new SupabaseServiceRepository(supabase),
    scheduleRepo: new SupabaseScheduleRepository(supabase),
    bookingRepo: new SupabaseBookingRepository(supabase),
    customerRepo: new SupabaseCustomerRepository(supabase),
  }
}
