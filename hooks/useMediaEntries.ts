"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { toast } from "sonner"
import { getEntries, deleteEntry } from "@/lib/actions"
import type { MediaEntry } from "@/lib/database.types"

export function useMediaEntries() {
    const [allEntries, setAllEntries] = useState<MediaEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [initialLoading, setInitialLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchEntries = useCallback(async (isInitial = false) => {
        try {
            setLoading(true)
            setError(null)

            const result = await getEntries()

            if (!result.success) {
                throw new Error(result.error || "Failed to load entries")
            }

            setAllEntries(result.data || [])
        } catch (err) {
            console.error("Failed to fetch entries:", err)
            const errorMessage = err instanceof Error ? err.message : "Failed to load entries"
            setError(errorMessage)
            toast.error(errorMessage)
        } finally {
            setLoading(false)
            if (isInitial) {
                setInitialLoading(false)
            }
        }
    }, [])

    useEffect(() => {
        fetchEntries(true)
    }, [fetchEntries])

    const updateEntryInList = (updatedEntry: MediaEntry) => {
        setAllEntries(prev =>
            prev.map(entry => entry.id === updatedEntry.id ? updatedEntry : entry)
        )
    }

    const handleDelete = async (id: string) => {
        try {
            const result = await deleteEntry(id)

            if (!result.success) {
                throw new Error(result.error || "Failed to delete entry")
            }

            setAllEntries(prev => prev.filter((entry) => entry.id !== id))
            toast.success("Entry deleted successfully")
        } catch (err) {
            console.error("Failed to delete entry:", err)
            toast.error(err instanceof Error ? err.message : "Failed to delete entry")
        }
    }

    // All status buckets are derived from the single allEntries fetch. Previously
    // "Watching" rows were fetched a second time directly from Supabase even though
    // they're already present here — that extra round-trip is now gone.
    const watchingEntries = useMemo(
        () =>
            allEntries
                .filter((e) => e.status === "Watching")
                .sort((a, b) => {
                    const aWatched = a.last_watched_at ? new Date(a.last_watched_at).getTime() : 0
                    const bWatched = b.last_watched_at ? new Date(b.last_watched_at).getTime() : 0
                    if (bWatched !== aWatched) return bWatched - aWatched
                    const aUpdated = a.updated_at ? new Date(a.updated_at).getTime() : 0
                    const bUpdated = b.updated_at ? new Date(b.updated_at).getTime() : 0
                    return bUpdated - aUpdated
                }),
        [allEntries]
    )

    const watchedEntries = useMemo(() => {
        return allEntries
            .filter((e) => e.status === "Finished")
            .sort((a, b) => {
                const aTime = a.finish_date ? new Date(a.finish_date).getTime() : 0
                const bTime = b.finish_date ? new Date(b.finish_date).getTime() : 0
                return bTime - aTime
            })
    }, [allEntries])

    const plannedEntries = useMemo(
        () =>
            allEntries.filter(
                (e) =>
                    e.status === "Plan to Watch" || e.status === "Planned"
            ),
        [allEntries]
    )

    const holdAndDroppedEntries = useMemo(
        () =>
            allEntries.filter(
                (e) => e.status === "On Hold" || e.status === "Dropped"
            ),
        [allEntries]
    )

    return {
        allEntries,
        watchingEntries,
        watchedEntries,
        plannedEntries,
        holdAndDroppedEntries,
        loading,
        initialLoading,
        // Watching now derives from the same fetch, so it shares the initial load state.
        watchingLoading: initialLoading,
        error,
        refreshEntries: async () => {
            await fetchEntries(false)
        },
        // Updating allEntries automatically re-derives (and re-sorts) watchingEntries.
        handleWatchingEntryUpdate: updateEntryInList,
        updateEntryInList,
        handleDelete,
    }
}
