"use server"

import { createClient } from "@/lib/supabase/server"
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
