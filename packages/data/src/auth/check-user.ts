import { createClient } from "@supabase/supabase-js"

import type { Database, UserProfile } from "@analytics/domain"

export interface CheckUserApprovalInput {
  email: string
  serviceRoleKey: string
  supabaseUrl: string
}

export interface CheckUserApprovalResult {
  approved?: boolean
  exists: boolean
  status?: string
}

type UserApprovalProfile = Pick<UserProfile, "status">

interface UserApprovalProfileLookup {
  (normalizedEmail: string): Promise<{
    data: UserApprovalProfile | null
    error: { message: string } | null
  }>
}

function normalizeEmail(email: string) {
  return email.toLowerCase().trim()
}

export function resolveApprovalResult(profile: UserApprovalProfile | null): CheckUserApprovalResult {
  if (!profile) {
    return { exists: false }
  }

  return {
    exists: true,
    approved: profile.status === "approved",
    status: profile.status,
  }
}

export async function findUserApprovalProfileByEmail(
  lookupProfile: UserApprovalProfileLookup,
  email: string,
) {
  const { data: profile, error } = await lookupProfile(normalizeEmail(email))

  if (error) {
    throw new Error(error.message)
  }

  return profile
}

export async function checkUserApprovalByEmail({
  email,
  serviceRoleKey,
  supabaseUrl,
}: CheckUserApprovalInput): Promise<CheckUserApprovalResult> {
  const admin = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const profile = await findUserApprovalProfileByEmail(
    async (normalizedEmail) => {
      return await admin
        .from("user_profiles")
        .select("status")
        .eq("email", normalizedEmail)
        .maybeSingle()
    },
    email,
  )
  return resolveApprovalResult(profile)
}
