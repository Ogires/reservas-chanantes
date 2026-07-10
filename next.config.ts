import type { NextConfig } from "next";

// Cabeceras de seguridad (A05 / Web Security Esencial). En Next.js el
// equivalente a Helmet es la clave `headers()`. La CSP arranca en modo
// permisivo para scripts ('unsafe-inline') porque Next inyecta scripts de
// hidratación sin nonce; endurecerla a nonce es una mejora futura anotada
// en la memoria.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self'",
  // Supabase (REST/Auth/Realtime) — el resto de integraciones (Stripe,
  // Resend) son server-to-server y no generan tráfico desde el navegador.
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
]

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

export default nextConfig;
