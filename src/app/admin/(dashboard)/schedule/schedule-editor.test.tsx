// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ScheduleEditor } from './schedule-editor'
import { getAdminTranslations } from '@/infrastructure/i18n/admin-translations'

vi.mock('./actions', () => ({ saveSchedule: vi.fn() }))

const full = getAdminTranslations('es-ES')
const closedWeek = [0, 1, 2, 3, 4, 5, 6].map((dow) => ({
  dayOfWeek: dow,
  dayName: `Día ${dow}`,
  open: false,
  ranges: [] as { start: string; end: string }[],
}))

describe('ScheduleEditor', () => {
  it('al activar un día cerrado aparece el tramo horario por defecto (09:00–17:00)', async () => {
    render(
      <ScheduleEditor
        initialSchedule={closedWeek}
        timezone="Europe/Madrid"
        timezoneLabel="Horarios en Europe/Madrid"
        translations={full.schedule}
        commonTranslations={full.common}
      />
    )

    // Antes: todos los días cerrados, sin ningún tramo horario visible
    expect(screen.queryByDisplayValue('09:00')).not.toBeInTheDocument()

    // El usuario activa el "Día 1"
    await userEvent.click(screen.getByLabelText('Día 1'))

    // Después: aparece el tramo por defecto 09:00–17:00
    expect(screen.getByDisplayValue('09:00')).toBeInTheDocument()
    expect(screen.getByDisplayValue('17:00')).toBeInTheDocument()
  })
})
