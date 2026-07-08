import { describe, it, expect, vi } from 'vitest'
import { SupabaseScheduleRepository } from './schedule-repository'
import { TimeRange } from '@/domain/value-objects/time-range'

function makeClient(opts: { list?: unknown; error?: { message: string } } = {}) {
  const listResult = { data: opts.list ?? null, error: opts.error ?? null }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const builder: any = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    then: (resolve: (v: unknown) => void) => resolve(listResult),
  }
  const from = vi.fn(() => builder)
  return { supabase: { from } as never, builder }
}

const scheduleRow = {
  id: 'sc-1',
  tenant_id: 't-1',
  day_of_week: 1,
  time_ranges: [{ start: 540, end: 1020 }],
}

describe('SupabaseScheduleRepository', () => {
  it('findByTenantId construye una WeeklySchedule cuando hay filas', async () => {
    const { supabase } = makeClient({ list: [scheduleRow] })
    const ws = await new SupabaseScheduleRepository(supabase).findByTenantId('t-1')
    expect(ws).not.toBeNull()
  })

  it('findByTenantId devuelve null cuando no hay filas', async () => {
    const { supabase } = makeClient({ list: [] })
    expect(
      await new SupabaseScheduleRepository(supabase).findByTenantId('t-1')
    ).toBeNull()
  })

  it('findByTenantId lanza en error', async () => {
    const { supabase } = makeClient({ error: { message: 'sch' } })
    await expect(
      new SupabaseScheduleRepository(supabase).findByTenantId('t-1')
    ).rejects.toThrow(/sch/)
  })

  it('save borra e inserta las franjas con el payload correcto', async () => {
    const { supabase, builder } = makeClient({})
    await new SupabaseScheduleRepository(supabase).save('t-1', [
      { dayOfWeek: 1, timeRanges: [new TimeRange(540, 1020)] },
    ])
    expect(builder.delete).toHaveBeenCalled()
    expect(builder.insert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ tenant_id: 't-1', day_of_week: 1 }),
      ])
    )
  })

  it('save no inserta cuando la lista de franjas está vacía', async () => {
    const { supabase, builder } = makeClient({})
    await new SupabaseScheduleRepository(supabase).save('t-1', [])
    expect(builder.delete).toHaveBeenCalled()
    expect(builder.insert).not.toHaveBeenCalled()
  })
})
