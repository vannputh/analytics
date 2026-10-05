import { createClient } from "@supabase/supabase-js"

import type { Database } from "@analytics/domain"

function getPublicSupabaseConfig() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey =
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error("Missing public Supabase configuration.")
  }

  return { url, anonKey }
}

export function getBearerToken(request: Request): string | null {
  const authorization = request.headers.get("Authorization")
  if (!authorization?.startsWith("Bearer ")) {
    return null
  }

  return authorization.slice("Bearer ".length).trim() || null
}

export function createRequestSupabaseClient(request: Request) {
  const token = getBearerToken(request)
  const { url, anonKey } = getPublicSupabaseConfig()

  return createClient<Database>(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : undefined,
  })
}

export async function requireRequestUser(request: Request): Promise<Response | null> {
  const token = getBearerToken(request)
  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const client = createRequestSupabaseClient(request)
    const { data, error } = await client.auth.getUser(token)
    if (error || !data.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }
    return null
  } catch (error) {
    console.error("Expo API auth failed:", error)
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export function createAdminSupabaseClient() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error("Missing admin Supabase configuration.")
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
