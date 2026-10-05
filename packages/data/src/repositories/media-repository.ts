import type {
  AnalyticsSupabaseClient,
} from "../supabase/client"
import type {
  MediaEntry,
  MediaEntryInsert,
  MediaFieldOptions,
  MediaStatusHistory,
  MediaEntryUpdate,
} from "@analytics/domain"
import { buildRestartEntryPatch, extractMediaFieldOptions } from "@analytics/domain"

export interface MediaEntryFilters {
  status?: string
  medium?: string
  search?: string
  limit?: number
  offset?: number
}

export interface MediaBatchUpdateInput extends Partial<MediaEntryUpdate> {
  appendGenres?: string[]
}

export function createMediaRepository(client: AnalyticsSupabaseClient) {
  return {
    async getEntries(filters?: MediaEntryFilters): Promise<MediaEntry[]> {
      let query = client
        .from("media_entries")
        .select("*")
        .order("created_at", { ascending: false })

      if (filters?.status) {
        query = query.eq("status", filters.status)
      }

      if (filters?.medium) {
        query = query.eq("medium", filters.medium)
      } else {
        query = query.neq("medium", "Book")
      }

      if (filters?.search) {
        query = query.ilike("title", `%${filters.search}%`)
      }

      if (typeof filters?.limit === "number" && typeof filters?.offset === "number") {
        query = query.range(filters.offset, filters.offset + filters.limit - 1)
      } else if (typeof filters?.limit === "number") {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(error.message)
      }

      return data ?? []
    },

    async getWatchingEntries(): Promise<MediaEntry[]> {
      const { data, error } = await client
        .from("media_entries")
        .select("*")
        .eq("status", "watching")
        .order("last_watched_at", { ascending: false })
        .order("updated_at", { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      return data ?? []
    },

    async createEntry(input: MediaEntryInsert): Promise<MediaEntry> {
      const { data, error } = await client
        .from("media_entries")
        .insert(input)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    },

    async getEntry(id: string): Promise<MediaEntry | null> {
      const { data, error } = await client
        .from("media_entries")
        .select("*")
        .eq("id", id)
        .maybeSingle()

      if (error) {
        throw new Error(error.message)
      }

      return data
    },

    async updateEntry(id: string, input: MediaEntryUpdate): Promise<MediaEntry> {
      const { data, error } = await client
        .from("media_entries")
        .update(input)
        .eq("id", id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    },

    async deleteEntry(id: string): Promise<void> {
      const { error } = await client.from("media_entries").delete().eq("id", id)

      if (error) {
        throw new Error(error.message)
      }
    },

    async getStatusHistory(mediaEntryId: string): Promise<MediaStatusHistory[]> {
      const { data, error } = await client
        .from("media_status_history")
        .select("*")
        .eq("media_entry_id", mediaEntryId)
        .order("changed_at", { ascending: false })
        .limit(100)

      if (error) {
        throw new Error(error.message)
      }

      return data ?? []
    },

    async getUniqueFieldValues(): Promise<MediaFieldOptions> {
      const { data, error } = await client
        .from("media_entries")
        .select("type, status, medium, platform, language")

      if (error) {
        throw new Error(error.message)
      }

      return extractMediaFieldOptions((data ?? []) as MediaEntry[])
    },

    async restartEntry(id: string, today?: string): Promise<MediaEntry> {
      const entry = await this.getEntry(id)

      if (!entry) {
        throw new Error("Entry not found")
      }

      const patch = buildRestartEntryPatch(entry, today)

      if (!patch) {
        throw new Error("Can only restart items that are Dropped or On Hold")
      }

      return this.updateEntry(id, patch)
    },

    async batchUpdateEntries(entries: MediaEntry[], updates: MediaBatchUpdateInput): Promise<MediaEntry[]> {
      if (!entries.length) {
        return []
      }

      const appendGenres = updates.appendGenres?.map((genre) => genre.trim()).filter(Boolean) ?? []
      const { appendGenres: _appendGenres, ...baseUpdates } = updates

      if (appendGenres.length) {
        const results: MediaEntry[] = []

        for (const entry of entries) {
          const currentGenres = Array.isArray(entry.genre) ? entry.genre.filter(Boolean) : []
          const genreMap = new Map(currentGenres.map((genre) => [genre.toLowerCase(), genre]))

          for (const genre of appendGenres) {
            if (!genreMap.has(genre.toLowerCase())) {
              genreMap.set(genre.toLowerCase(), genre)
            }
          }

          results.push(
            await this.updateEntry(entry.id, {
              ...baseUpdates,
              genre: Array.from(genreMap.values()),
            }),
          )
        }

        return results
      }

      const { data, error } = await client
        .from("media_entries")
        .update(baseUpdates)
        .in("id", entries.map((entry) => entry.id))
        .select()

      if (error) {
        throw new Error(error.message)
      }

      return data ?? []
    },
  }
}
