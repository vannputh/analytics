import {
  createClient as createSupabaseClient,
  type SupabaseClient,
  type SupabaseClientOptions,
} from "@supabase/supabase-js"

import type { Database } from "@analytics/domain"

export type AnalyticsSupabaseClient = SupabaseClient<Database>

export interface CreateAnalyticsSupabaseClientInput {
  supabaseUrl: string
  supabaseAnonKey: string
  options?: SupabaseClientOptions<"public">
}

export function createAnalyticsSupabaseClient({
  supabaseUrl,
  supabaseAnonKey,
  options,
}: CreateAnalyticsSupabaseClientInput): AnalyticsSupabaseClient {
  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, options)
}
