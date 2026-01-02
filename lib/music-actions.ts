'use server'

import { createClient } from '@/lib/supabase/server'
import { MusicEntry, MusicEntryInsert, MusicEntryUpdate } from '@/lib/database.types'
import { revalidatePath } from 'next/cache'
import { MusicFilterState } from './music-types'

export async function createMusicEntry(data: MusicEntryInsert) {
    try {
        const supabase = await createClient()

        const { data: newEntry, error } = await (supabase
            .from('music_entries' as any) as any)
            .insert(data)
            .select()
            .single()

        if (error) {
            console.error('Error creating music entry:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/music')
        revalidatePath('/music/analytics')

        return { success: true, data: newEntry }
    } catch (error) {
        console.error('Unexpected error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

export async function updateMusicEntry(id: string, data: MusicEntryUpdate) {
    try {
        const supabase = await createClient()

        const { data: updatedEntry, error } = await (supabase
            .from('music_entries' as any) as any)
            .update(data)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Error updating music entry:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/music')
        revalidatePath('/music/analytics')

        return { success: true, data: updatedEntry }
    } catch (error) {
        console.error('Unexpected error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

export async function getMusicEntry(id: string) {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('music_entries')
            .select('*')
            .eq('id', id)
            .single()

        if (error) {
            console.error('Error fetching music entry:', error)
            return { success: false, error: error.message }
        }

        return { success: true, data }
    } catch (error) {
        console.error('Unexpected error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

export async function deleteMusicEntry(id: string) {
    try {
        const supabase = await createClient()

        const { error } = await supabase
            .from('music_entries')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Error deleting music entry:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/music')
        revalidatePath('/music/analytics')

        return { success: true }
    } catch (error) {
        console.error('Unexpected error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

export async function getMusicEntries(filters?: Partial<MusicFilterState> & {
    search?: string
    limit?: number
    offset?: number
    getCount?: boolean
}) {
    try {
        const supabase = await createClient()

        let query = (supabase
            .from('music_entries' as any) as any)
            .select('*', { count: filters?.getCount ? 'exact' : undefined })
            .order('created_at', { ascending: false })

        if (filters?.statuses?.length) {
            query = query.in('status', filters.statuses)
        }

        if (filters?.types?.length) {
            query = query.in('type', filters.types)
        }

        // Platforms array overlap
        if (filters?.platforms?.length) {
            query = query.overlaps('platform', filters.platforms)
        }

        if (filters?.dateFrom) {
            query = query.gte('created_at', filters.dateFrom) // Music doesn't have start/finish date universally, use created_at or release_date?
        }

        if (filters?.dateTo) {
            query = query.lte('created_at', filters.dateTo)
        }

        // Arrays overlap check
        if (filters?.genres?.length) {
            query = query.overlaps('genre', filters.genres)
        }

        if (filters?.search) {
            const s = filters.search
            query = query.or(`title.ilike.%${s}%,artist.ilike.%${s}%,album.ilike.%${s}%`)
        }

        if (filters?.limit !== undefined && filters?.offset !== undefined) {
            query = query.range(filters.offset, filters.offset + filters.limit - 1)
        } else if (filters?.limit !== undefined) {
            query = query.limit(filters.limit)
        }

        const { data, error, count } = await query

        if (error) {
            console.error('Error fetching music entries:', error)
            return { success: false, error: error.message }
        }

        return {
            success: true,
            data: data || [],
            count: count
        }
    } catch (error) {
        console.error('Unexpected error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

export async function getMusicStats() {
    try {
        const supabase = await createClient()
        const currentYear = new Date().getFullYear()
        const yearStart = `${currentYear}-01-01`
        const yearEnd = `${currentYear}-12-31`

        const [totalCountResult, minutesResult] = await Promise.all([
            (supabase.from('music_entries' as any) as any).select('*', { count: 'exact', head: true }),
            (supabase.from('music_entries' as any) as any).select('duration_minutes, listen_count')
        ])

        if (totalCountResult.error) throw totalCountResult.error
        if (minutesResult.error) throw minutesResult.error

        const totalMinutes = (minutesResult.data || []).reduce((sum: number, item: any) => sum + ((item.duration_minutes || 0) * (item.listen_count || 1)), 0)

        return {
            success: true,
            data: {
                totalTracks: totalCountResult.count || 0,
                totalMinutesListened: totalMinutes
            }
        }
    } catch (error) {
        console.error('Error getting music stats:', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
}
