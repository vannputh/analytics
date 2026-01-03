"use client"

import { useState } from "react"
import { format } from "date-fns"
import { CalendarIcon, X, Filter, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { FoodFilterState, defaultFoodFilterState } from "@/lib/food-types"

interface FilterOptions {
    itemCategories: string[]
    cuisineTypes: string[]
    categories: string[]
    priceLevels: string[]
}

interface FoodFilterBarProps {
    filters: FoodFilterState
    onFiltersChange: (filters: FoodFilterState) => void
    options: FilterOptions
    totalCount: number
    filteredCount: number
}

interface MultiSelectProps {
    label: string
    options: string[]
    selected: string[]
    onChange: (selected: string[]) => void
}

function MultiSelect({ label, options, selected, onChange }: MultiSelectProps) {
    const [open, setOpen] = useState(false)

    const toggleOption = (option: string) => {
        if (selected.includes(option)) {
            onChange(selected.filter((s) => s !== option))
        } else {
            onChange([...selected, option])
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                        "h-8 border-dashed font-mono text-xs",
                        selected.length > 0 && "border-foreground/50"
                    )}
                >
                    {label}
                    {selected.length > 0 && (
                        <Badge
                            variant="secondary"
                            className="ml-1.5 rounded-sm px-1 font-mono text-[10px]"
                        >
                            {selected.length}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="start">
                <div className="space-y-1 max-h-64 overflow-y-auto">
                    {options.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-2 text-center">No options</p>
                    ) : (
                        options.map((option) => (
                            <button
                                key={option}
                                onClick={() => toggleOption(option)}
                                className={cn(
                                    "w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-sm hover:bg-accent transition-colors text-left font-mono",
                                    selected.includes(option) && "bg-accent"
                                )}
                            >
                                <div
                                    className={cn(
                                        "w-3 h-3 border rounded-sm flex items-center justify-center",
                                        selected.includes(option) && "bg-foreground border-foreground"
                                    )}
                                >
                                    {selected.includes(option) && (
                                        <span className="text-background text-[8px]">✓</span>
                                    )}
                                </div>
                                <span className="truncate">{option}</span>
                            </button>
                        ))
                    )}
                </div>
                {selected.length > 0 && (
                    <>
                        <Separator className="my-2" />
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full h-7 text-xs"
                            onClick={() => onChange([])}
                        >
                            Clear selection
                        </Button>
                    </>
                )}
            </PopoverContent>
        </Popover>
    )
}

interface DateRangePickerProps {
    from: string | null
    to: string | null
    onChange: (from: string | null, to: string | null) => void
}

function DateRangePicker({ from, to, onChange }: DateRangePickerProps) {
    const [open, setOpen] = useState(false)

    const fromDate = from ? new Date(from) : undefined
    const toDate = to ? new Date(to) : undefined

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                        "h-8 border-dashed font-mono text-xs justify-start",
                        (from || to) && "border-foreground/50"
                    )}
                >
                    <CalendarIcon className="mr-1.5 h-3 w-3" />
                    {from || to ? (
                        <>
                            {from ? format(new Date(from), "MMM d, yy") : "Start"}
                            {" → "}
                            {to ? format(new Date(to), "MMM d, yy") : "Now"}
                        </>
                    ) : (
                        "Date Range"
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 max-h-[80vh] overflow-y-auto" align="start">
                <div className="flex flex-col sm:flex-row">
                    <div className="p-2 border-b sm:border-b-0 sm:border-r">
                        <p className="text-xs text-muted-foreground mb-2 px-2">From</p>
                        <Calendar
                            mode="single"
                            selected={fromDate}
                            onSelect={(date) => {
                                onChange(date ? format(date, "yyyy-MM-dd") : null, to)
                            }}
                            initialFocus
                        />
                    </div>
                    <div className="p-2">
                        <p className="text-xs text-muted-foreground mb-2 px-2">To</p>
                        <Calendar
                            mode="single"
                            selected={toDate}
                            onSelect={(date) => {
                                onChange(from, date ? format(date, "yyyy-MM-dd") : null)
                            }}
                        />
                    </div>
                </div>
                <Separator />
                <div className="p-2 flex flex-wrap gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 min-w-[4rem] h-7 text-xs"
                        onClick={() => {
                            onChange(null, null)
                            setOpen(false)
                        }}
                    >
                        Clear
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 min-w-[4rem] h-7 text-xs"
                        onClick={() => {
                            const now = new Date()
                            const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
                            onChange(format(yearAgo, "yyyy-MM-dd"), format(now, "yyyy-MM-dd"))
                        }}
                    >
                        Last Year
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 min-w-[4rem] h-7 text-xs"
                        onClick={() => {
                            const now = new Date()
                            const startOfYear = new Date(now.getFullYear(), 0, 1)
                            onChange(format(startOfYear, "yyyy-MM-dd"), format(now, "yyyy-MM-dd"))
                        }}
                    >
                        This Year
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}

export function FoodFilterBar({
    filters,
    onFiltersChange,
    options,
    totalCount,
    filteredCount,
}: FoodFilterBarProps) {
    const hasActiveFilters =
        filters.dateFrom ||
        filters.dateTo ||
        filters.itemCategories.length > 0 ||
        filters.cuisineTypes.length > 0 ||
        filters.categories.length > 0 ||
        filters.priceLevels.length > 0

    const activeFilterCount = [
        filters.dateFrom || filters.dateTo ? 1 : 0,
        filters.itemCategories.length,
        filters.cuisineTypes.length,
        filters.categories.length,
        filters.priceLevels.length,
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
                    label="Food Type"
                    options={options.itemCategories}
                    selected={filters.itemCategories}
                    onChange={(itemCategories) => onFiltersChange({ ...filters, itemCategories })}
                />

                <MultiSelect
                    label="Cuisine"
                    options={options.cuisineTypes}
                    selected={filters.cuisineTypes}
                    onChange={(cuisineTypes) => onFiltersChange({ ...filters, cuisineTypes })}
                />

                <MultiSelect
                    label="Place Type"
                    options={options.categories}
                    selected={filters.categories}
                    onChange={(categories) => onFiltersChange({ ...filters, categories })}
                />

                <MultiSelect
                    label="Price"
                    options={options.priceLevels}
                    selected={filters.priceLevels}
                    onChange={(priceLevels) => onFiltersChange({ ...filters, priceLevels })}
                />

                {hasActiveFilters && (
                    <>
                        <Separator orientation="vertical" className="h-6" />
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs font-mono"
                            onClick={() => onFiltersChange(defaultFoodFilterState)}
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
                        {filteredCount === totalCount ? totalCount : `${filteredCount}/${totalCount}`} entries
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
                    {filters.itemCategories.map((c) => (
                        <button
                            key={c}
                            type="button"
                            onClick={() =>
                                onFiltersChange({
                                    ...filters,
                                    itemCategories: filters.itemCategories.filter((x) => x !== c),
                                })
                            }
                            className="inline-flex items-center h-5 px-1.5 text-[10px] font-mono rounded-sm bg-secondary hover:bg-destructive/20 transition-colors"
                        >
                            {c}
                            <X className="ml-1 h-2.5 w-2.5" />
                        </button>
                    ))}
                    {filters.cuisineTypes.map((c) => (
                        <button
                            key={c}
                            type="button"
                            onClick={() =>
                                onFiltersChange({
                                    ...filters,
                                    cuisineTypes: filters.cuisineTypes.filter((x) => x !== c),
                                })
                            }
                            className="inline-flex items-center h-5 px-1.5 text-[10px] font-mono rounded-sm bg-secondary hover:bg-destructive/20 transition-colors"
                        >
                            {c}
                            <X className="ml-1 h-2.5 w-2.5" />
                        </button>
                    ))}
                    {filters.categories.map((c) => (
                        <button
                            key={c}
                            type="button"
                            onClick={() =>
                                onFiltersChange({
                                    ...filters,
                                    categories: filters.categories.filter((x) => x !== c),
                                })
                            }
                            className="inline-flex items-center h-5 px-1.5 text-[10px] font-mono rounded-sm bg-secondary hover:bg-destructive/20 transition-colors"
                        >
                            {c}
                            <X className="ml-1 h-2.5 w-2.5" />
                        </button>
                    ))}
                    {filters.priceLevels.map((p) => (
                        <button
                            key={p}
                            type="button"
                            onClick={() =>
                                onFiltersChange({
                                    ...filters,
                                    priceLevels: filters.priceLevels.filter((x) => x !== p),
                                })
                            }
                            className="inline-flex items-center h-5 px-1.5 text-[10px] font-mono rounded-sm bg-secondary hover:bg-destructive/20 transition-colors"
                        >
                            {p}
                            <X className="ml-1 h-2.5 w-2.5" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

export default FoodFilterBar
