"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { MediaEntry } from "@/lib/database.types"
import { FilterState, defaultFilterState, applyFilters, extractFilterOptions, areFiltersEqual } from "@/lib/filter-types"
import { MediaTable } from "@/components/media-table"
import { GlobalFilterBar } from "@/components/analytics/GlobalFilterBar"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle, Table2, Search, X, Columns } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { COLUMN_DEFINITIONS, ColumnKey } from "@/components/media-table"
import { getUserPreference, setUserPreference } from "@/lib/user-preferences"

// Helper functions to serialize/deserialize FilterState to/from URL params
function filtersToParams(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams()

  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom)
  if (filters.dateTo) params.set("dateTo", filters.dateTo)
  if (filters.genres.length > 0) params.set("genres", filters.genres.join(","))
  if (filters.mediums.length > 0) params.set("mediums", filters.mediums.join(","))
  if (filters.languages.length > 0) params.set("languages", filters.languages.join(","))
  if (filters.platforms.length > 0) params.set("platforms", filters.platforms.join(","))
  if (filters.statuses.length > 0) params.set("statuses", filters.statuses.join(","))
  if (filters.types.length > 0) params.set("types", filters.types.join(","))

  return params
}

function paramsToFilters(params: URLSearchParams): FilterState {
  return {
    dateFrom: params.get("dateFrom") || null,
    dateTo: params.get("dateTo") || null,
    genres: params.get("genres")?.split(",").filter(Boolean) || [],
    mediums: params.get("mediums")?.split(",").filter(Boolean) || [],
    languages: params.get("languages")?.split(",").filter(Boolean) || [],
    platforms: params.get("platforms")?.split(",").filter(Boolean) || [],
    statuses: params.get("statuses")?.split(",").filter(Boolean) || [],
    types: params.get("types")?.split(",").filter(Boolean) || [],
  }
}

export default function EntriesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [entries, setEntries] = useState<MediaEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterState>(defaultFilterState)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSelectMode, setShowSelectMode] = useState(false)
  // Initialize with defaults - will be loaded from Supabase in useEffect
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(() => {
    const defaultVisible = new Set<ColumnKey>()
    Object.entries(COLUMN_DEFINITIONS).forEach(([key, def]) => {
      if (def.defaultVisible) {
        defaultVisible.add(key as ColumnKey)
      }
    })
    return defaultVisible
  })
  const [columnsLoaded, setColumnsLoaded] = useState(false)
  const isInitialized = useRef(false)

  // Load column visibility from Supabase
  useEffect(() => {
    async function loadColumns() {
      const saved = await getUserPreference<string[]>("media-table-visible-columns")
      if (saved && Array.isArray(saved)) {
        setVisibleColumns(new Set(saved))
      }
      setColumnsLoaded(true)
    }
    loadColumns()
  }, [])

  // Save column visibility to Supabase and notify MediaTable
  useEffect(() => {
    if (!columnsLoaded) return // Don't save until we've loaded initial state
    
    async function saveColumns() {
      await setUserPreference("media-table-visible-columns", Array.from(visibleColumns))
      // Dispatch custom event to notify MediaTable of changes
      window.dispatchEvent(new CustomEvent("media-table-columns-changed", { 
        detail: Array.from(visibleColumns) 
      }))
    }
    saveColumns()
  }, [visibleColumns, columnsLoaded])

  // Initialize filters from URL params on mount or param change
  useEffect(() => {
    const urlFilters = paramsToFilters(searchParams)

    // Only update state if filters have actually changed
    setFilters(prev => {
      if (areFiltersEqual(prev, urlFilters)) return prev
      return urlFilters
    })

    const searchParam = searchParams.get("search") || ""
    if (searchParam !== searchQuery) {
      setSearchQuery(searchParam)
    }

    isInitialized.current = true
  }, [searchParams])

  // Update URL params when filters or search change
  useEffect(() => {
    if (!isInitialized.current) return

    const params = filtersToParams(filters)
    if (searchQuery) params.set("search", searchQuery)

    // Construct new query string
    const newQueryString = params.toString()
    const currentQueryString = searchParams.toString()

    // Only clean update the URL if something changed
    if (newQueryString !== currentQueryString) {
      const newUrl = newQueryString ? `/entries?${newQueryString}` : "/entries"
      router.replace(newUrl, { scroll: false })
    }
  }, [filters, searchQuery, router, searchParams])

  useEffect(() => {
    async function fetchEntries() {
      try {
        setLoading(true)
        const { data, error: fetchError } = await supabase
          .from("media_entries")
          .select("*")
          .order("created_at", { ascending: false })

        if (fetchError) throw fetchError
        setEntries(data || [])
      } catch (err) {
        console.error("Failed to fetch entries:", err)
        setError(err instanceof Error ? err.message : "Failed to load entries")
        toast.error("Failed to load entries")
      } finally {
        setLoading(false)
      }
    }

    fetchEntries()
  }, [])

  // Extract filter options from raw data
  const filterOptions = useMemo(() => extractFilterOptions(entries), [entries])

  // Apply filters to entries
  const filterFilteredEntries = useMemo(() => applyFilters(entries, filters), [entries, filters])

  // Apply search filter
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return filterFilteredEntries

    const query = searchQuery.toLowerCase().trim()
    return filterFilteredEntries.filter((entry) => {
      // Search in title
      if (entry.title?.toLowerCase().includes(query)) return true

      // Search in genre (array)
      if (entry.genre && Array.isArray(entry.genre)) {
        if (entry.genre.some(g => g.toLowerCase().includes(query))) return true
      }

      // Search in platform
      if (entry.platform?.toLowerCase().includes(query)) return true

      // Search in type
      if (entry.type?.toLowerCase().includes(query)) return true

      // Search in medium
      if (entry.medium?.toLowerCase().includes(query)) return true

      // Search in language
      if (entry.language?.toLowerCase().includes(query)) return true

      // Search in status
      if (entry.status?.toLowerCase().includes(query)) return true

      // Search in season
      if (entry.season?.toLowerCase().includes(query)) return true

      return false
    })
  }, [filterFilteredEntries, searchQuery])

  const handleEdit = (entry: MediaEntry) => {
    router.push(`/add?id=${entry.id}`)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return

    try {
      const { error: deleteError } = await supabase
        .from("media_entries")
        .delete()
        .eq("id", id)

      if (deleteError) throw deleteError

      setEntries(entries.filter((entry) => entry.id !== id))
      toast.success("Entry deleted successfully")
    } catch (err) {
      console.error("Failed to delete entry:", err)
      toast.error("Failed to delete entry")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm font-mono">Loading entries...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-destructive">
          <AlertCircle className="h-8 w-8" />
          <p className="text-sm font-mono">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <PageHeader title="All Entries" />

      {/* Global Filter Bar */}
      {entries.length > 0 && (
        <GlobalFilterBar
          filters={filters}
          onFiltersChange={setFilters}
          options={filterOptions}
          totalCount={entries.length}
          filteredCount={filteredEntries.length}
        />
      )}

      {/* Main Content */}
      <main className="p-4 sm:p-6">
        <div className="mb-6 space-y-4">
          {/* Search Bar and Column Picker */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by title, genre, platform, type, medium, language, status, or season..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Columns className="h-4 w-4" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Object.entries(COLUMN_DEFINITIONS).map(([key, def]) => (
                  <DropdownMenuCheckboxItem
                    key={key}
                    checked={visibleColumns.has(key as ColumnKey)}
                    onCheckedChange={() => {
                      setVisibleColumns(prev => {
                        const next = new Set(prev)
                        if (next.has(key as ColumnKey)) {
                          next.delete(key as ColumnKey)
                        } else {
                          next.add(key as ColumnKey)
                        }
                        return next
                      })
                    }}
                  >
                    {def.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Table2 className="h-12 w-12 opacity-30 mb-4" />
            <p className="text-sm font-mono mb-3">No entries yet</p>
            <Button asChild>
              <Link href="/import">Import CSV</Link>
            </Button>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Table2 className="h-12 w-12 opacity-30 mb-4" />
            <p className="text-sm font-mono mb-3">No entries match the current filters</p>
            <Button variant="outline" onClick={() => setFilters(defaultFilterState)}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <MediaTable
            entries={filteredEntries}
            onEdit={handleEdit}
            onDelete={handleDelete}
            showSelectMode={showSelectMode}
            onSelectModeChange={setShowSelectMode}
            onRefresh={async () => {
              setLoading(true)
              try {
                const { data, error: fetchError } = await supabase
                  .from("media_entries")
                  .select("*")
                  .order("created_at", { ascending: false })
                if (fetchError) throw fetchError
                setEntries(data || [])
              } catch (err) {
                console.error("Failed to refresh entries:", err)
              } finally {
                setLoading(false)
              }
            }}
          />
        )}
      </main>
    </div>
  )
}

