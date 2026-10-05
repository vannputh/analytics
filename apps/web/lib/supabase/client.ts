import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "../database.types"

// Memoize a single browser client. Creating a new client per call/render spins up
// duplicate GoTrue auth instances (and the "Multiple GoTrueClient instances" warning).
let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined

export function createClient() {
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return browserClient
}




