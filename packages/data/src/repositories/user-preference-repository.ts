import type { AnalyticsSupabaseClient } from "../supabase/client"

export function createUserPreferenceRepository(client: AnalyticsSupabaseClient) {
  return {
    async getUserPreference<T = unknown>(userId: string, key: string): Promise<T | null> {
      const { data, error } = await client
        .from("user_preferences")
        .select("preference_value")
        .eq("user_id", userId)
        .eq("preference_key", key)
        .maybeSingle()

      if (error) {
        throw new Error(error.message)
      }

      return (data?.preference_value as T | undefined) ?? null
    },

    async setUserPreference<T = unknown>(userId: string, key: string, value: T): Promise<void> {
      const { error } = await client
        .from("user_preferences")
        .upsert(
          {
            user_id: userId,
            preference_key: key,
            preference_value: value as never,
          },
          {
            onConflict: "user_id,preference_key",
          },
        )

      if (error) {
        throw new Error(error.message)
      }
    },
  }
}
