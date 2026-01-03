"use client"

import { X, Filter, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { MusicFilterState, defaultMusicFilterState } from "@/lib/music-types"
import { MultiSelect, DateRangePicker } from "@/components/filter-components"

interface FilterOptions {
    genres: string[]
    types: string[]
    platforms: string[]
    statuses: string[]
    artists: string[]
}

interface MusicFilterBarProps {
    filters: MusicFilterState
    onFiltersChange: (filters: MusicFilterState) => void
    options: FilterOptions
    totalCount: number
    filteredCount: number
}

export function MusicFilterBar({
    filters,
    onFiltersChange,
    options,
    totalCount,
    filteredCount,
}: MusicFilterBarProps) {
    const hasActiveFilters =
        filters.dateFrom ||
        filters.dateTo ||
        filters.genres.length > 0 ||
        filters.types.length > 0 ||
        filters.platforms.length > 0 ||
        filters.statuses.length > 0 ||
        filters.artists.length > 0

    const activeFilterCount = [
        filters.dateFrom || filters.dateTo ? 1 : 0,
        filters.genres.length,
        filters.types.length,
        filters.platforms.length,
        filters.statuses.length,
        filters.artists.length,
    ].reduce((a, b) => a + b, 0)

    return (
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-3 overflow-x-auto scrollbar-hide">
                <div className="hidden sm:flex items-center gap-1.5 text-muted-foreground flex-shrink-0">
                    <Filter className="h-3.5 w-3.5" />
                    <span className="text-xs font-mono uppercase tracking-wider">Filters</span>
                </div>

                <Separator orientation="vertical" className="h-6 hidden sm:block" />

                <DateRangePicker
                    from={filters.dateFrom}
                    to={filters.dateTo}
                    onChange={(from, to) => onFiltersChange({ ...filters, dateFrom: from, dateTo: to })}
                />

                <MultiSelect
                    label="Genre"
                    options={options.genres}
                    selected={filters.genres}
                    onChange={(genres) => onFiltersChange({ ...filters, genres })}
                />

                <MultiSelect
                    label="Type"
                    options={options.types}
                    selected={filters.types}
                    onChange={(types) => onFiltersChange({ ...filters, types })}
                />

                <MultiSelect
                    label="Platform"
                    options={options.platforms}
                    selected={filters.platforms}
                    onChange={(platforms) => onFiltersChange({ ...filters, platforms })}
                />

                <MultiSelect
                    label="Status"
                    options={options.statuses}
                    selected={filters.statuses}
                    onChange={(statuses) => onFiltersChange({ ...filters, statuses })}
                />

                <MultiSelect
                    label="Artist"
                    options={options.artists}
                    selected={filters.artists}
                    onChange={(artists) => onFiltersChange({ ...filters, artists })}
                />

                {hasActiveFilters && (
                    <>
                        <Separator orientation="vertical" className="h-6" />
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs font-mono"
                            onClick={() => onFiltersChange(defaultMusicFilterState)}
                        >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Reset
                        </Button>
                    </>
                )}

                <div className="ml-auto flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs font-mono text-muted-foreground flex-shrink-0">
                    {hasActiveFilters && (
                        <Badge variant="outline" className="font-mono text-[10px]">
                            {activeFilterCount} active
                        </Badge>
                    )}
                    <span>
                        {filteredCount === totalCount ? totalCount : `${filteredCount}/${totalCount}`} tracks
                    </span>
                </div>
            </div>

            {/* Active filter pills */}
            {hasActiveFilters && (
                <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 pb-2 flex-wrap">
                    {(filters.dateFrom || filters.dateTo) && (
                        <button
                            type="button"
                            onClick={() => onFiltersChange({ ...filters, dateFrom: null, dateTo: null })}
                            className="inline-flex items-center h-5 px-1.5 text-[10px] font-mono rounded-sm bg-secondary hover:bg-destructive/20 transition-colors"
                        >
                            {filters.dateFrom || "∞"} → {filters.dateTo || "∞"}
                            <X className="ml-1 h-2.5 w-2.5" />
                        </button>
                    )}
                    {filters.genres.map((g) => (
                        <button
                            key={g}
                            type="button"
                            onClick={() =>
                                onFiltersChange({
                                    ...filters,
                                    genres: filters.genres.filter((x) => x !== g),
                                })
                            }
                            className="inline-flex items-center h-5 px-1.5 text-[10px] font-mono rounded-sm bg-secondary hover:bg-destructive/20 transition-colors"
                        >
                            {g}
                            <X className="ml-1 h-2.5 w-2.5" />
                        </button>
                    ))}
                    {filters.types.map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() =>
                                onFiltersChange({
                                    ...filters,
                                    types: filters.types.filter((x) => x !== t),
                                })
                            }
                            className="inline-flex items-center h-5 px-1.5 text-[10px] font-mono rounded-sm bg-secondary hover:bg-destructive/20 transition-colors"
                        >
                            {t}
                            <X className="ml-1 h-2.5 w-2.5" />
                        </button>
                    ))}
                    {filters.platforms.map((p) => (
                        <button
                            key={p}
                            type="button"
                            onClick={() =>
                                onFiltersChange({
                                    ...filters,
                                    platforms: filters.platforms.filter((x) => x !== p),
                                })
                            }
                            className="inline-flex items-center h-5 px-1.5 text-[10px] font-mono rounded-sm bg-secondary hover:bg-destructive/20 transition-colors"
                        >
                            {p}
                            <X className="ml-1 h-2.5 w-2.5" />
                        </button>
                    ))}
                    {filters.statuses.map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() =>
                                onFiltersChange({
                                    ...filters,
                                    statuses: filters.statuses.filter((x) => x !== s),
                                })
                            }
                            className="inline-flex items-center h-5 px-1.5 text-[10px] font-mono rounded-sm bg-secondary hover:bg-destructive/20 transition-colors"
                        >
                            {s}
                            <X className="ml-1 h-2.5 w-2.5" />
                        </button>
                    ))}
                    {filters.artists.map((a) => (
                        <button
                            key={a}
                            type="button"
                            onClick={() =>
                                onFiltersChange({
                                    ...filters,
                                    artists: filters.artists.filter((x) => x !== a),
                                })
                            }
                            className="inline-flex items-center h-5 px-1.5 text-[10px] font-mono rounded-sm bg-secondary hover:bg-destructive/20 transition-colors"
                        >
                            {a}
                            <X className="ml-1 h-2.5 w-2.5" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

export default MusicFilterBar
