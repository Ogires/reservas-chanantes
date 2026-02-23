/** Returns the tenant's local date as YYYY-MM-DD (en-CA yields YYYY-MM-DD) */
export function getTenantLocalDate(timezone: string, now?: Date): string {
  const d = now ?? new Date()
  return d.toLocaleDateString('en-CA', { timeZone: timezone })
}

/** Returns minutes from midnight in the tenant's timezone (0–1439) */
export function getTenantLocalMinutes(timezone: string, now?: Date): number {
  const d = now ?? new Date()
  const parts = d
    .toLocaleTimeString('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    .split(':')
  return Number(parts[0]) * 60 + Number(parts[1])
}

/** Adds `days` to a YYYY-MM-DD string and returns a new YYYY-MM-DD string */
export function addDaysToLocalDate(localDate: string, days: number): string {
  const [y, m, d] = localDate.split('-').map(Number)
  const ms = Date.UTC(y, m - 1, d + days)
  const date = new Date(ms)
  const yy = date.getUTCFullYear()
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(date.getUTCDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}
