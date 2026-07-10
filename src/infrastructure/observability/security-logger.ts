type SecurityEventType =
  | 'login_success'
  | 'login_failure'
  | 'rate_limited'
  | 'booking_cancelled'
  | 'password_reset_requested'

interface SecurityEvent {
  type: SecurityEventType
  ip?: string
  email?: string
  userId?: string
  path?: string
}

/**
 * Registro estructurado de eventos de seguridad (A09). Whitelist explícita de
 * campos: nunca se serializan passwords, tokens ni PII fuera de email/IP.
 * En Vercel, console.* llega a los logs de la plataforma; añadir un DSN de
 * Sentry es la mejora de monitorización anotada como línea futura.
 */
export function logSecurityEvent(event: SecurityEvent): void {
  const safe = {
    channel: 'security',
    type: event.type,
    ...(event.ip && { ip: event.ip }),
    ...(event.email && { email: event.email }),
    ...(event.userId && { userId: event.userId }),
    ...(event.path && { path: event.path }),
  }
  console.info(JSON.stringify(safe))
}
