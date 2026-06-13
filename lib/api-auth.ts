import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Guard for API routes that proxy paid third-party services (Gemini, TMDB/OMDb,
 * Google Maps). Next middleware deliberately lets `/api/*` through, so each of
 * these routes must authenticate itself or anyone can drain the API budget.
 *
 * Returns a 401 `NextResponse` when there is no authenticated user, otherwise
 * `null` (proceed). Usage:
 *
 *   const unauthorized = await requireAuth()
 *   if (unauthorized) return unauthorized
 */
export async function requireAuth(): Promise<NextResponse | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return null
}
