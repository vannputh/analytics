import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { Database } from "@/lib/database.types"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next") || "/"
  const isSignup = requestUrl.searchParams.get("signup") === "true"

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (supabaseUrl && supabaseServiceRoleKey) {
        const supabaseAdmin = createAdminClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        })

        // Verify the user exists in the system
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(data.user.id)

        if (userError || !userData.user) {
          await supabase.auth.signOut()
          return NextResponse.redirect(new URL("/login?error=unauthorized", request.url))
        }

        // Check user profile approval status
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('user_profiles')
          .select('status')
          .eq('user_id', data.user.id)
          .single()

        // If this is a signup callback, the profile will be created by the client
        // So we just redirect to login with a success message
        if (isSignup) {
          await supabase.auth.signOut()
          return NextResponse.redirect(new URL("/login", request.url))
        }

        // For login, check approval status
        if (profileError || !profile) {
          // No profile found - shouldn't happen for existing users
          await supabase.auth.signOut()
          return NextResponse.redirect(new URL("/login?error=unauthorized", request.url))
        }

        if (profile.status !== 'approved') {
          // User is not approved yet
          await supabase.auth.signOut()
          return NextResponse.redirect(new URL("/login?error=not_approved", request.url))
        }

        // User is approved, allow them in
        return NextResponse.redirect(new URL(next, request.url))
      }

      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth_failed", request.url))
}




