'use server'

import { createClient } from '@/lib/supabase/server'
import { BookEntry, BookEntryInsert, BookEntryUpdate } from '@/lib/database.types'
import { revalidatePath } from 'next/cache'
import { BookFilterState } from './book-types'
import { normalizeLanguage } from './language-utils'

export async function createBookEntry(data: BookEntryInsert) {
    try {
        const supabase = await createClient()
        const payload = { ...data }
        if (payload.language != null && payload.language.length > 0) {
            payload.language = normalizeLanguage(payload.language)
        }

        const { data: newEntry, error } = await (supabase
            .from('book_entries' as any) as any)
            .insert(payload)
            .select()
            .single()

        if (error) {
            console.error('Error creating book entry:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/books')
        revalidatePath('/books/analytics')

        return { success: true, data: newEntry }
    } catch (error) {
        console.error('Unexpected error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

export async function updateBookEntry(id: string, data: BookEntryUpdate) {
    try {
        const supabase = await createClient()
        const payload = { ...data }
        if (payload.language != null && payload.language.length > 0) {
            payload.language = normalizeLanguage(payload.language)
        }

        const { data: updatedEntry, error } = await (supabase
            .from('book_entries' as any) as any)
            .update(payload)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Error updating book entry:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/books')
        revalidatePath('/books/analytics')

        return { success: true, data: updatedEntry }
    } catch (error) {
        console.error('Unexpected error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

export async function getBookEntry(id: string) {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('book_entries')
            .select('*')
            .eq('id', id)
            .single()

        if (error) {
            console.error('Error fetching book entry:', error)
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

export async function deleteBookEntry(id: string) {
    try {
        const supabase = await createClient()

        const { error } = await supabase
            .from('book_entries')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Error deleting book entry:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/books')
        revalidatePath('/books/analytics')

        return { success: true }
    } catch (error) {
        console.error('Unexpected error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

export async function getBookEntries(filters?: Partial<BookFilterState> & {
    search?: string
    limit?: number
    offset?: number
    getCount?: boolean
}) {
    try {
        const supabase = await createClient()

        let query = (supabase
            .from('book_entries' as any) as any)
            .select('*', { count: filters?.getCount ? 'exact' : undefined })
            .order('created_at', { ascending: false })

        if (filters?.statuses?.length) {
            query = query.in('status', filters.statuses)
        }

        if (filters?.formats?.length) {
            query = query.in('format', filters.formats)
        }

        // For arrays like genre and language, we need to check if ANY of the filter items are in the array
        if (filters?.genres?.length) {
            query = query.overlaps('genre', filters.genres)
        }

        if (filters?.languages?.length) {
            query = query.overlaps('language', filters.languages)
        }

        // Authors (checking if array contains any) - Wait, author is a string in new schema, but filters suggests array
        // If author is just a string:
        if (filters?.authors?.length) {
            query = query.in('author', filters.authors)
        }

        if (filters?.dateFrom) {
            // Check finish_date first, then start_date
            query = query.or(`finish_date.gte.${filters.dateFrom},start_date.gte.${filters.dateFrom}`)
        }

        if (filters?.dateTo) {
            query = query.or(`finish_date.lte.${filters.dateTo},start_date.lte.${filters.dateTo}`)
        }

        if (filters?.search) {
            const s = filters.search
            query = query.or(`title.ilike.%${s}%,author.ilike.%${s}%,series_name.ilike.%${s}%`)
        }

        if (filters?.limit !== undefined && filters?.offset !== undefined) {
            query = query.range(filters.offset, filters.offset + filters.limit - 1)
        } else if (filters?.limit !== undefined) {
            query = query.limit(filters.limit)
        }

        const { data, error, count } = await query

        if (error) {
            console.error('Error fetching book entries:', error)
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

export async function getBookStats() {
    try {
        const supabase = await createClient()
        const currentYear = new Date().getFullYear()
        const yearStart = `${currentYear}-01-01`
        const yearEnd = `${currentYear}-12-31`

        const [totalCountResult, finishedCountResult, pagesResult] = await Promise.all([
            (supabase.from('book_entries' as any) as any).select('*', { count: 'exact', head: true }),

            (supabase
                .from('book_entries' as any) as any)
                .select('*', { count: 'exact', head: true })
                .eq('status', 'Finished')
                .gte('finish_date', yearStart)
                .lte('finish_date', yearEnd),

            (supabase.from('book_entries' as any) as any).select('pages')
        ])

        if (totalCountResult.error) throw totalCountResult.error
        if (finishedCountResult.error) throw finishedCountResult.error
        if (pagesResult.error) throw pagesResult.error

        const totalPages = (pagesResult.data || []).reduce((sum: number, book: any) => sum + (book.pages || 0), 0)

        return {
            success: true,
            data: {
                totalBooks: totalCountResult.count || 0,
                finishedThisYear: finishedCountResult.count || 0,
                totalPagesRead: totalPages
            }
        }
    } catch (error) {
        console.error('Error getting book stats:', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
}
