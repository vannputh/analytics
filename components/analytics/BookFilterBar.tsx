"use client"

import { X, Filter, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { BookFilterState, defaultBookFilterState } from "@/lib/book-types"
import { MultiSelect, DateRangePicker } from "@/components/filter-components"

interface FilterOptions {
    genres: string[]
    formats: string[]
    languages: string[]
    statuses: string[]
    authors: string[]
}

interface BookFilterBarProps {
    filters: BookFilterState
    onFiltersChange: (filters: BookFilterState) => void
    options: FilterOptions
    totalCount: number
    filteredCount: number
}

export function BookFilterBar({
    filters,
    onFiltersChange,
    options,
    totalCount,
    filteredCount,
}: BookFilterBarProps) {
    const hasActiveFilters =
        filters.dateFrom ||
        filters.dateTo ||
        filters.genres.length > 0 ||
        filters.formats.length > 0 ||
        filters.languages.length > 0 ||
        filters.statuses.length > 0 ||
        filters.authors.length > 0

    const activeFilterCount = [
        filters.dateFrom || filters.dateTo ? 1 : 0,
        filters.genres.length,
        filters.formats.length,
        filters.languages.length,
        filters.statuses.length,
        filters.authors.length,
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
                    label="Format"
                    options={options.formats}
                    selected={filters.formats}
                    onChange={(formats) => onFiltersChange({ ...filters, formats })}
                />

                <MultiSelect
                    label="Status"
                    options={options.statuses}
                    selected={filters.statuses}
                    onChange={(statuses) => onFiltersChange({ ...filters, statuses })}
                />

                <MultiSelect
                    label="Author"
                    options={options.authors}
                    selected={filters.authors}
                    onChange={(authors) => onFiltersChange({ ...filters, authors })}
                />

                <MultiSelect
                    label="Language"
                    options={options.languages}
                    selected={filters.languages}
                    onChange={(languages) => onFiltersChange({ ...filters, languages })}
                />

                {hasActiveFilters && (
                    <>
                        <Separator orientation="vertical" className="h-6" />
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs font-mono"
                            onClick={() => onFiltersChange(defaultBookFilterState)}
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
                        {filteredCount === totalCount ? totalCount : `${filteredCount}/${totalCount}`} books
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
                    {filters.formats.map((f) => (
                        <button
                            key={f}
                            type="button"
                            onClick={() =>
                                onFiltersChange({
                                    ...filters,
                                    formats: filters.formats.filter((x) => x !== f),
                                })
                            }
                            className="inline-flex items-center h-5 px-1.5 text-[10px] font-mono rounded-sm bg-secondary hover:bg-destructive/20 transition-colors"
                        >
                            {f}
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
                    {filters.authors.map((a) => (
                        <button
                            key={a}
                            type="button"
                            onClick={() =>
                                onFiltersChange({
                                    ...filters,
                                    authors: filters.authors.filter((x) => x !== a),
                                })
                            }
                            className="inline-flex items-center h-5 px-1.5 text-[10px] font-mono rounded-sm bg-secondary hover:bg-destructive/20 transition-colors"
                        >
                            {a}
                            <X className="ml-1 h-2.5 w-2.5" />
                        </button>
                    ))}
                    {filters.languages.map((l) => (
                        <button
                            key={l}
                            type="button"
                            onClick={() =>
                                onFiltersChange({
                                    ...filters,
                                    languages: filters.languages.filter((x) => x !== l),
                                })
                            }
                            className="inline-flex items-center h-5 px-1.5 text-[10px] font-mono rounded-sm bg-secondary hover:bg-destructive/20 transition-colors"
                        >
                            {l}
                            <X className="ml-1 h-2.5 w-2.5" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

export default BookFilterBar
