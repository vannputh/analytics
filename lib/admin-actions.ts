"use server"

import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { UserProfile } from "@/lib/database.types"

export async function approveUser(userId: string) {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { success: false, error: "Not authenticated" }
  }

  // Check if current user is admin
  const { data: adminProfile } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()

  if (!adminProfile?.is_admin) {
    return { success: false, error: "Unauthorized: Admin access required" }
  }

  // Update user profile to approved
  const { error } = await supabase
    .from('user_profiles')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: user.id,
    })
    .eq('user_id', userId)

  if (error) {
    console.error("Error approving user:", error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/requests')
  revalidatePath('/admin/users')
  
  return { success: true }
}

export async function rejectUser(userId: string, reason?: string) {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { success: false, error: "Not authenticated" }
  }

  // Check if current user is admin
  const { data: adminProfile } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()

  if (!adminProfile?.is_admin) {
    return { success: false, error: "Unauthorized: Admin access required" }
  }

  // Update user profile to rejected
  const { error } = await supabase
    .from('user_profiles')
    .update({
      status: 'rejected',
      rejection_reason: reason || null,
    })
    .eq('user_id', userId)

  if (error) {
    console.error("Error rejecting user:", error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/requests')
  revalidatePath('/admin/users')
  
  return { success: true }
}

export async function listPendingRequests(): Promise<{ success: boolean; data?: UserProfile[]; error?: string }> {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { success: false, error: "Not authenticated" }
  }

  // Check if current user is admin
  const { data: adminProfile } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()

  if (!adminProfile?.is_admin) {
    return { success: false, error: "Unauthorized: Admin access required" }
  }

  // Get pending requests
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('status', 'pending')
    .order('requested_at', { ascending: false })

  if (error) {
    console.error("Error listing pending requests:", error)
    return { success: false, error: error.message }
  }

  return { success: true, data: data || [] }
}

export async function listAllUsers(): Promise<{ success: boolean; data?: UserProfile[]; error?: string }> {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { success: false, error: "Not authenticated" }
  }

  // Check if current user is admin
  const { data: adminProfile } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()

  if (!adminProfile?.is_admin) {
    return { success: false, error: "Unauthorized: Admin access required" }
  }

  // Get all users
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Error listing users:", error)
    return { success: false, error: error.message }
  }

  return { success: true, data: data || [] }
}

export async function checkIsAdmin(): Promise<boolean> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return false

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()

  return profile?.is_admin || false
}

export async function addUserByAdmin(
  email: string,
  isAdmin = false
): Promise<{ success: boolean; error?: string }> {
  const normalizedEmail = email.toLowerCase().trim()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
    return { success: false, error: "Please provide a valid email address" }
  }

  const supabase = await createClient()

  const {
    data: { user: currentUser },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !currentUser) {
    return { success: false, error: "Not authenticated" }
  }

  const { data: adminProfile } = await supabase
    .from("user_profiles")
    .select("is_admin")
    .eq("user_id", currentUser.id)
    .single()

  if (!adminProfile?.is_admin) {
    return { success: false, error: "Unauthorized: Admin access required" }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return { success: false, error: "Server configuration error" }
  }

  const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers()

  if (usersError) {
    console.error("Error listing users:", usersError)
    return { success: false, error: "Failed to list users" }
  }

  let authUser = usersData.users.find(
    (candidate) => candidate.email?.toLowerCase().trim() === normalizedEmail
  )

  if (!authUser) {
    const { data: invitedUserData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      normalizedEmail
    )

    if (inviteError || !invitedUserData.user) {
      console.error("Error inviting user:", inviteError)
      return { success: false, error: inviteError?.message || "Failed to invite user" }
    }

    authUser = invitedUserData.user
  }

  const approvedAt = new Date().toISOString()

  const { data: existingProfile, error: profileFetchError } = await supabaseAdmin
    .from("user_profiles")
    .select("id")
    .eq("user_id", authUser.id)
    .maybeSingle()

  if (profileFetchError) {
    console.error("Error checking profile:", profileFetchError)
    return { success: false, error: "Failed to check user profile" }
  }

  if (existingProfile) {
    const { error: updateError } = await supabaseAdmin
      .from("user_profiles")
      .update({
        email: normalizedEmail,
        status: "approved",
        is_admin: isAdmin,
        approved_at: approvedAt,
        approved_by: currentUser.id,
      })
      .eq("user_id", authUser.id)

    if (updateError) {
      console.error("Error updating user profile:", updateError)
      return { success: false, error: updateError.message }
    }
  } else {
    const { error: insertError } = await supabaseAdmin.from("user_profiles").insert({
      user_id: authUser.id,
      email: normalizedEmail,
      status: "approved",
      is_admin: isAdmin,
      requested_at: approvedAt,
      approved_at: approvedAt,
      approved_by: currentUser.id,
    })

    if (insertError) {
      console.error("Error creating user profile:", insertError)
      return { success: false, error: insertError.message }
    }
  }

  revalidatePath("/admin/users")
  revalidatePath("/admin/requests")

  return { success: true }
}

export async function updateUserAdminRole(
  userId: string,
  isAdmin: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user: currentUser },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !currentUser) {
    return { success: false, error: "Not authenticated" }
  }

  const { data: currentProfile, error: profileError } = await supabase
    .from("user_profiles")
    .select("is_admin")
    .eq("user_id", currentUser.id)
    .single()

  if (profileError || !currentProfile?.is_admin) {
    return { success: false, error: "Unauthorized: Admin access required" }
  }

  if (currentUser.id === userId && !isAdmin) {
    return { success: false, error: "You cannot remove your own admin access" }
  }

  const { error: updateError } = await supabase
    .from("user_profiles")
    .update({ is_admin: isAdmin })
    .eq("user_id", userId)

  if (updateError) {
    console.error("Error updating admin role:", updateError)
    return { success: false, error: updateError.message }
  }

  revalidatePath("/admin/users")

  return { success: true }
}
