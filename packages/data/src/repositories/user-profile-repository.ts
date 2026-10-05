import type { UserProfile, UserProfileInsert } from "@analytics/domain"

import type { AnalyticsSupabaseClient } from "../supabase/client"

export type UserProfileAuthState = "approved" | "pending" | "rejected" | "missing"

export interface PendingUserProfileInput {
  email: string
  userId: string
}

export function buildPendingUserProfileInsert({
  email,
  userId,
}: PendingUserProfileInput): UserProfileInsert {
  return {
    email: email.trim().toLowerCase(),
    status: "pending",
    user_id: userId,
  }
}

export function resolveUserProfileAuthState(
  profile: Pick<UserProfile, "status"> | null,
): UserProfileAuthState {
  if (!profile) {
    return "missing"
  }

  if (profile.status === "approved") {
    return "approved"
  }

  if (profile.status === "rejected") {
    return "rejected"
  }

  return "pending"
}

export function createUserProfileRepository(client: AnalyticsSupabaseClient) {
  return {
    async getCurrentProfile(userId: string): Promise<UserProfile | null> {
      const { data, error } = await client
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle()

      if (error) {
        throw new Error(error.message)
      }

      return data
    },

    async createPendingProfile(input: PendingUserProfileInput): Promise<UserProfile> {
      const { data, error } = await client
        .from("user_profiles")
        .insert(buildPendingUserProfileInsert(input))
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
  }
}
