import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@analytics/domain"

import { getPublicSupabaseConfig } from "./config"
import { secureStore } from "./secure-store"

const publicSupabaseConfig = getPublicSupabaseConfig()

if (!publicSupabaseConfig) {
  console.warn("Supabase public environment variables are not configured for the Expo app.")
}

export const supabase: SupabaseClient<Database> | null = publicSupabaseConfig
  ? createClient<Database>(publicSupabaseConfig.url, publicSupabaseConfig.anonKey, {
      auth: {
        storage: secureStore,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null
