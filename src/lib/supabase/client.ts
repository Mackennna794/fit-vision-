import { createBrowserClient } from '@supabase/ssr'
import { Database } from './types'

/**
 * Creates a Supabase client for use in the browser (Client Components).
 * Uses the public anon key — row-level security policies govern data access.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
