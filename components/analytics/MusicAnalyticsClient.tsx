"use client"

import { useState, useMemo } from "react"
import { MusicEntry } from "@/lib/database.types"
import { MusicFilterState, defaultMusicFilterState, applyMusicFilters, extractMusicFilterOptions } from "@/lib/music-types"
import { useMusicMetrics } from "@/hooks/useMusicMetrics"
import { MusicAnalyticsCharts } from "@/components/analytics/MusicAnalyticsCharts"
import { MusicFilterBar } from "@/components/analytics/MusicFilterBar"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface MusicAnalyticsClientProps {
    music: MusicEntry[]
}

export function MusicAnalyticsClient({ music }: MusicAnalyticsClientProps) {
    const [filters, setFilters] = useState<MusicFilterState>(defaultMusicFilterState)

    // Extract filter options from raw data
    const filterOptions = useMemo(() => extractMusicFilterOptions(music), [music])

    // Apply filters to entries
    const filteredMusic = useMemo(() => applyMusicFilters(music, filters), [music, filters])

    // Calculate metrics from filtered entries
    const metrics = useMusicMetrics(filteredMusic)

    if (music.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <AlertCircle className="h-12 w-12 opacity-30 mb-4" />
                <p className="text-sm font-mono mb-3">No music yet</p>
                <Button asChild>
                    <Link href="/music">Add Music</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-0">
            {/* Filter Bar */}
            <div className="-mx-4 sm:-mx-6 -mt-4 sm:-mt-6">
                <MusicFilterBar
                    filters={filters}
                    onFiltersChange={setFilters}
                    options={filterOptions}
                    totalCount={music.length}
                    filteredCount={filteredMusic.length}
                />
            </div>

            {/* Charts */}
            <div className="pt-6">
                <MusicAnalyticsCharts metrics={metrics} />
            </div>
        </div>
    )
}
