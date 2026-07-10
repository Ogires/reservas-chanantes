import { createClient } from '@supabase/supabase-js'
import { env } from '@/infrastructure/config/env'

export function createSupabaseAdmin() {
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  )
}
