import type { SupabaseClient } from '@supabase/supabase-js'
import type { Booking } from '@/domain/entities/booking'
import type { BookingRepository } from '@/application/ports/booking-repository'
import { TimeRange } from '@/domain/value-objects/time-range'
import type { BookingStatus } from '@/domain/types'
import { SlotTakenError } from '@/domain/errors/domain-errors'

interface BookingRow {
  id: string
  tenant_id: string
  service_id: string
  customer_id: string
  date: string
  start_minutes: number
  end_minutes: number
  status: string
  stripe_checkout_session_id: string | null
  created_at: string
}

function toDomain(row: BookingRow): Booking {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    serviceId: row.service_id,
    customerId: row.customer_id,
    date: row.date,
    timeRange: new TimeRange(row.start_minutes, row.end_minutes),
    status: row.status as BookingStatus,
    stripeCheckoutSessionId: row.stripe_checkout_session_id ?? undefined,
    createdAt: new Date(row.created_at),
  }
}

export class SupabaseBookingRepository implements BookingRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findByTenantAndDate(
    tenantId: string,
    date: string
  ): Promise<Booking[]> {
    const { data, error } = await this.supabase
      .from('bookings')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('date', date)

    if (error) throw new Error(`Failed to fetch bookings: ${error.message}`)
    return (data ?? []).map(toDomain)
  }

  async findByTenantAndDateRange(
    tenantId: string,
    startDate: string,
    endDate: string
  ): Promise<Booking[]> {
    const { data, error } = await this.supabase
      .from('bookings')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
      .order('start_minutes', { ascending: true })

    if (error) throw new Error(`Failed to fetch bookings: ${error.message}`)
    return (data ?? []).map(toDomain)
  }

  async findById(id: string): Promise<Booking | null> {
    const { data, error } = await this.supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Failed to fetch booking: ${error.message}`)
    }
    return toDomain(data)
  }

  async save(booking: Booking): Promise<Booking> {
    const { data, error } = await this.supabase
      .from('bookings')
      .insert({
        id: booking.id,
        tenant_id: booking.tenantId,
        service_id: booking.serviceId,
        customer_id: booking.customerId,
        date: booking.date,
        start_minutes: booking.timeRange.start,
        end_minutes: booking.timeRange.end,
        status: booking.status,
      })
      .select()
      .single()

    if (error) {
      // 23P01 = exclusion_violation (Postgres): the bookings_no_overlap
      // constraint rejected this insert because another booking already
      // occupies an overlapping time range for the same tenant+date.
      if (error.code === '23P01') {
        throw new SlotTakenError()
      }
      throw new Error(`Failed to save booking: ${error.message}`)
    }
    return toDomain(data)
  }

  async updateStatus(id: string, status: BookingStatus): Promise<void> {
    const { error } = await this.supabase
      .from('bookings')
      .update({ status })
      .eq('id', id)

    if (error) throw new Error(`Failed to update booking status: ${error.message}`)
  }

  async updateStripeSessionId(id: string, sessionId: string): Promise<void> {
    const { error } = await this.supabase
      .from('bookings')
      .update({ stripe_checkout_session_id: sessionId })
      .eq('id', id)

    if (error)
      throw new Error(`Failed to update stripe session id: ${error.message}`)
  }

  async findByCustomerId(customerId: string): Promise<Booking[]> {
    const { data, error } = await this.supabase
      .from('bookings')
      .select('*')
      .eq('customer_id', customerId)
      .order('date', { ascending: false })
      .order('start_minutes', { ascending: false })

    if (error) throw new Error(`Failed to fetch customer bookings: ${error.message}`)
    return (data ?? []).map(toDomain)
  }

  async findConfirmedForDateWithoutReminder(
    date: string
  ): Promise<Booking[]> {
    const { data, error } = await this.supabase
      .from('bookings')
      .select('*')
      .eq('date', date)
      .eq('status', 'CONFIRMED')
      .is('reminder_sent_at', null)

    if (error)
      throw new Error(`Failed to fetch bookings for reminder: ${error.message}`)
    return (data ?? []).map(toDomain)
  }

  async claimReminder(id: string, sentAt: Date): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('bookings')
      .update({ reminder_sent_at: sentAt.toISOString() })
      .eq('id', id)
      .is('reminder_sent_at', null)
      .select('id')

    if (error) {
      throw new Error(`Failed to claim reminder: ${error.message}`)
    }
    return (data ?? []).length > 0
  }

  async releaseReminder(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('bookings')
      .update({ reminder_sent_at: null })
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to release reminder: ${error.message}`)
    }
  }
}
