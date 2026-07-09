import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Endpoint de estado / keep-alive. Hace una consulta mínima a la base de datos
// (un `count` sin traer filas) para evitar que el proyecto Supabase del plan
// gratuito se pause por inactividad (~7 días). No expone datos ni requiere auth.
export const dynamic = 'force-dynamic'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    return NextResponse.json(
      { ok: false, db: 'unconfigured' },
      { status: 503 }
    )
  }

  try {
    const supabase = createServerClient(url, key, {
      cookies: { getAll: () => [] },
    })
    const { error } = await supabase
      .from('tenants')
      .select('id', { head: true, count: 'exact' })

    return NextResponse.json(
      {
        ok: !error,
        db: error ? 'error' : 'up',
        ts: new Date().toISOString(),
      },
      { status: error ? 503 : 200 }
    )
  } catch {
    return NextResponse.json({ ok: false, db: 'error' }, { status: 503 })
  }
}
