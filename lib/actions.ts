'use server'

import { createClient } from '@/lib/supabase/server'
import { MediaEntry, MediaStatusHistory } from '@/lib/database.types'
import { revalidatePath } from 'next/cache'

export type CreateEntryInput = Omit<MediaEntry, 'id' | 'created_at' | 'updated_at'>

export async function createEntry(data: CreateEntryInput) {
  try {
    const supabase = await createClient()
    
    const { data: newEntry, error } = await supabase
      .from('media_entries')
      .insert(data)
      .select()
      .single()

    if (error) {
      console.error('Error creating entry:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/')
    revalidatePath('/dashboard')
    
    return { success: true, data: newEntry }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export async function updateEntry(id: string, data: Partial<CreateEntryInput>) {
  try {
    const supabase = await createClient()
    
    const { data: updatedEntry, error } = await supabase
      .from('media_entries')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating entry:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/')
    revalidatePath('/dashboard')
    
    return { success: true, data: updatedEntry }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export async function deleteEntry(id: string) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('media_entries')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting entry:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/')
    revalidatePath('/dashboard')
    
    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export async function batchUploadEntries(entries: CreateEntryInput[]) {
  try {
    const supabase = await createClient()
    
    // Insert entries in batches of 100 to avoid timeout
    const batchSize = 100
    const results = []
    
    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize)
      
      const { data, error } = await supabase
        .from('media_entries')
        .insert(batch)
        .select()

      if (error) {
        console.error('Error in batch upload:', error)
        return { 
          success: false, 
          error: error.message,
          processedCount: i 
        }
      }

      results.push(...(data || []))
    }

    revalidatePath('/')
    revalidatePath('/dashboard')
    
    return { 
      success: true, 
      data: results,
      count: results.length 
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export async function getEntries(filters?: {
  status?: string
  medium?: string
  search?: string
}) {
  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('media_entries')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.medium) {
      query = query.eq('medium', filters.medium)
    }

    if (filters?.search) {
      query = query.ilike('title', `%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching entries:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export async function getStats() {
  try {
    const supabase = await createClient()
    
    // Get all entries
    const { data: allEntries, error } = await supabase
      .from('media_entries')
      .select('*')

    if (error) {
      console.error('Error fetching stats:', error)
      return { success: false, error: error.message }
    }

    const entries = allEntries || []
    const currentYear = new Date().getFullYear()

    // Calculate stats
    const finishedThisYear = entries.filter(entry => {
      if (entry.finish_date) {
        const finishYear = new Date(entry.finish_date).getFullYear()
        return finishYear === currentYear && entry.status === 'Finished'
      }
      return false
    }).length

    const totalSpent = entries.reduce((sum, entry) => {
      return sum + (entry.price || 0)
    }, 0)

    // Get top medium
    const mediumCounts = entries.reduce((acc, entry) => {
      const medium = entry.medium || 'Unknown'
      acc[medium] = (acc[medium] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const topMedium = Object.entries(mediumCounts).sort((a, b) => b[1] - a[1])[0]

    return {
      success: true,
      data: {
        finishedThisYear,
        totalSpent,
        topMedium: topMedium ? topMedium[0] : 'None',
        topMediumCount: topMedium ? topMedium[1] : 0,
        totalEntries: entries.length,
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export async function getStatusHistory(mediaEntryId: string) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('media_status_history')
      .select('*')
      .eq('media_entry_id', mediaEntryId)
      .order('changed_at', { ascending: false })

    if (error) {
      console.error('Error fetching status history:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export async function restartEntry(id: string) {
  try {
    const supabase = await createClient()
    
    // Get current entry
    const { data: entry, error: fetchError } = await supabase
      .from('media_entries')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !entry) {
      return { success: false, error: 'Entry not found' }
    }

    // Only restart if currently Dropped or On Hold
    if (entry.status !== 'Dropped' && entry.status !== 'On Hold') {
      return { 
        success: false, 
        error: 'Can only restart items that are Dropped or On Hold' 
      }
    }

    // Update status to In Progress and clear finish_date
    const { data: updatedEntry, error: updateError } = await supabase
      .from('media_entries')
      .update({
        status: 'In Progress',
        finish_date: null,
        start_date: entry.start_date || new Date().toISOString().split('T')[0],
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error restarting entry:', updateError)
      return { success: false, error: updateError.message }
    }

    revalidatePath('/')
    revalidatePath('/dashboard')
    
    return { success: true, data: updatedEntry }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

