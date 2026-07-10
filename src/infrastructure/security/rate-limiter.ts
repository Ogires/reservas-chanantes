interface Options {
  windowMs: number
  max: number
}

/**
 * Ventana deslizante en memoria. `now` es inyectable para tests deterministas
 * (evita Date.now()). En serverless el estado es por-instancia: defensa en
 * profundidad a nivel de app, no la única barrera.
 */
export class RateLimiter {
  private readonly hits = new Map<string, number[]>()

  constructor(private readonly opts: Options) {}

  check(key: string, now: () => number = () => Date.now()): boolean {
    const t = now()
    const cutoff = t - this.opts.windowMs
    const recent = (this.hits.get(key) ?? []).filter((ts) => ts > cutoff)
    if (recent.length >= this.opts.max) {
      this.hits.set(key, recent)
      return false
    }
    recent.push(t)
    this.hits.set(key, recent)
    return true
  }
}

// Instancias compartidas por tipo de endpoint (límites más estrictos en auth).
export const authLimiter = new RateLimiter({ windowMs: 60_000, max: 5 })
export const bookingLimiter = new RateLimiter({ windowMs: 60_000, max: 10 })
