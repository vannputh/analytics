"use client"

import { useState, Suspense, useEffect, useMemo, useRef } from "react"
import dynamic from "next/dynamic"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { MediaEntry } from "@/lib/database.types"
import { applyFilters } from "@/lib/filter-types"
import { MediaTable, COLUMN_DEFINITIONS, ColumnKey } from "@/components/media-table"
import { GlobalFilterBar } from "@/components/analytics/GlobalFilterBar"
import { Button } from "@/components/ui/button"
import { AlertCircle, Calendar, ListTodo, Pause, ChevronDown, ChevronRight, Columns, CheckSquare, Shuffle } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { DiaryPageSkeleton } from "@/components/skeletons"
import { useMediaEntries } from "@/hooks/useMediaEntries"
import { useMediaFilters } from "@/hooks/useMediaFilters"
import { WatchingSection } from "@/components/media/WatchingSection"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useColumnPreferences } from "@/hooks/useColumnPreferences"
import { WatchThisDialog } from "@/components/watch-this-dialog"
import { MovieDiaryStickyBar, MovieDiarySectionKey } from "@/components/media/MovieDiaryStickyBar"

const MediaDetailsDialog = dynamic(
  () => import("@/components/media-details-dialog").then(m => m.MediaDetailsDialog),
  { ssr: false }
)

const matchesDiarySearch = (entry: MediaEntry, query: string) => {
  const q = query.toLowerCase().trim()
  if (!q) return true

  if (entry.title?.toLowerCase().includes(q)) return true
  if (entry.genre && Array.isArray(entry.genre) && entry.genre.some((g) => String(g).toLowerCase().includes(q))) return true
  if (entry.platform?.toLowerCase().includes(q)) return true
  if (entry.type?.toLowerCase().includes(q)) return true
  if (entry.medium?.toLowerCase().includes(q)) return true
  if (entry.language && Array.isArray(entry.language) && entry.language.some((l) => String(l).toLowerCase().includes(q))) return true
  if (entry.status?.toLowerCase().includes(q)) return true
  if (entry.season?.toLowerCase().includes(q)) return true

  return false
}

function EntriesPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const {
    allEntries,
    watchingEntries,
    watchedEntries,
    plannedEntries,
    holdAndDroppedEntries,
    loading,
    initialLoading,
    watchingLoading,
    error,
    refreshEntries,
    handleWatchingEntryUpdate,
    updateEntryInList,
    handleDelete
  } = useMediaEntries()

  const {
    filters,
    setFilters,
    searchQuery,
    setSearchQuery,
    filterOptions
  } = useMediaFilters(allEntries)

  const filteredWatching = useMemo(
    () => watchingEntries.filter((entry) => matchesDiarySearch(entry, searchQuery)),
    [watchingEntries, searchQuery]
  )

  const filteredWatched = useMemo(
    () => applyFilters(watchedEntries, filters).filter((entry) => matchesDiarySearch(entry, searchQuery)),
    [watchedEntries, filters, searchQuery]
  )

  const filteredPlanned = useMemo(
    () => plannedEntries.filter((entry) => matchesDiarySearch(entry, searchQuery)),
    [plannedEntries, searchQuery]
  )

  const filteredHoldAndDropped = useMemo(
    () => holdAndDroppedEntries.filter((entry) => matchesDiarySearch(entry, searchQuery)),
    [holdAndDroppedEntries, searchQuery]
  )

  const { visibleColumns, toggleColumn } = useColumnPreferences()

  const [showSelectMode, setShowSelectMode] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [watchedCollapsed, setWatchedCollapsed] = useState(false)
  const [plannedCollapsed, setPlannedCollapsed] = useState(false)
  const [holdDroppedCollapsed, setHoldDroppedCollapsed] = useState(false)
  const [entryToOpenId, setEntryToOpenId] = useState<string | null>(null)
  const [watchThisEntry, setWatchThisEntry] = useState<MediaEntry | null>(null)
  const [activeSection, setActiveSection] = useState<MovieDiarySectionKey | null>(null)
  const programmaticScrollRef = useRef(false)
  const programmaticScrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const watchingSectionRef = useRef<HTMLElement | null>(null)
  const watchedSectionRef = useRef<HTMLElement | null>(null)
  const plannedSectionRef = useRef<HTMLElement | null>(null)
  const holdDroppedSectionRef = useRef<HTMLElement | null>(null)

  const handlePickRandomPlanned = () => {
    if (filteredPlanned.length === 0) {
      toast.message("No planned items match your filters.")
      return
    }
    setPlannedCollapsed(false)
    const random = filteredPlanned[Math.floor(Math.random() * filteredPlanned.length)]
    if (random) setWatchThisEntry(random)
  }

  // Refetch and clear URL when landing after add (redirect with ?refreshed=1)
  useEffect(() => {
    if (searchParams.get("refreshed") === "1") {
      refreshEntries()
      router.replace("/media")
    }
  }, [searchParams, router, refreshEntries])

  // Active-section detection for the sticky nav. IntersectionObserver avoids reading
  // layout (getBoundingClientRect) on every scroll frame. Re-runs when sections mount
  // (after data loads) so the newly-rendered sections get observed.
  useEffect(() => {
    const sectionRefs: Array<{ key: MovieDiarySectionKey; ref: React.RefObject<HTMLElement | null> }> = [
      { key: "watching", ref: watchingSectionRef },
      { key: "watched", ref: watchedSectionRef },
      { key: "planned", ref: plannedSectionRef },
      { key: "holdDropped", ref: holdDroppedSectionRef },
    ]

    // The observer callback only reports targets whose visibility changed, so track
    // cumulative visibility and pick the first intersecting section in document order.
    const visibility = new Map<MovieDiarySectionKey, boolean>()

    const observer = new IntersectionObserver(
      (observed) => {
        if (programmaticScrollRef.current) return
        for (const entry of observed) {
          const key = (entry.target as HTMLElement).dataset.sectionKey as MovieDiarySectionKey
          visibility.set(key, entry.isIntersecting)
        }
        const current = sectionRefs.find(({ key }) => visibility.get(key))?.key ?? null
        setActiveSection(current)
      },
      // Detection band: just below the sticky header (~170px) down to ~40% of the viewport.
      { rootMargin: "-170px 0px -60% 0px", threshold: 0 }
    )

    for (const { key, ref } of sectionRefs) {
      if (ref.current) {
        ref.current.dataset.sectionKey = key
        observer.observe(ref.current)
      }
    }

    return () => observer.disconnect()
  }, [initialLoading, allEntries.length])

  const sectionJumps: Array<{ key: MovieDiarySectionKey; label: string }> = [
    { key: "watching", label: "Watching" },
    { key: "watched", label: "Watched" },
    { key: "planned", label: "Planned" },
    { key: "holdDropped", label: "On Hold & Dropped" },
  ]

  const scrollToSection = (section: MovieDiarySectionKey) => {
    setActiveSection(section)
    programmaticScrollRef.current = true
    if (programmaticScrollTimerRef.current) clearTimeout(programmaticScrollTimerRef.current)

    if (section === "watched") {
      setWatchedCollapsed(false)
    } else if (section === "planned") {
      setPlannedCollapsed(false)
    } else if (section === "holdDropped") {
      setHoldDroppedCollapsed(false)
    }

    const sectionRef =
      section === "watching"
        ? watchingSectionRef
        : section === "watched"
          ? watchedSectionRef
          : section === "planned"
            ? plannedSectionRef
            : holdDroppedSectionRef

    window.setTimeout(() => {
      if (!sectionRef.current) return
      // When scrolled, the full header collapses and only the filter bar remains (~52px).
      // Use the sticky container's actual height so the section title lands right below it.
      const stickyEl = document.querySelector<HTMLElement>("[data-sticky-bar]")
      const stickyHeight = stickyEl ? stickyEl.getBoundingClientRect().height : 56
      const y = sectionRef.current.getBoundingClientRect().top + window.scrollY - stickyHeight - 8
      window.scrollTo({ top: y, behavior: "smooth" })
      // Re-enable scroll detection after smooth scroll completes (~700ms)
      programmaticScrollTimerRef.current = setTimeout(() => {
        programmaticScrollRef.current = false
      }, 800)
    }, 100)
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-background page-content">
        <PageHeader title="Diary" onMediaAdded={refreshEntries} />
        <DiaryPageSkeleton />
      </div>
    )
  }

  if (error && allEntries.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm font-mono text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={() => refreshEntries()}>
            Try again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background relative page-content">
      {/* Subtle top progress bar for subsequent loads (less jarring than a full-screen overlay) */}
      {loading && !initialLoading && (
        <div
          className="fixed top-0 left-0 right-0 z-[60] h-0.5 bg-primary/70 animate-pulse pointer-events-none"
          role="status"
          aria-label="Refreshing"
        />
      )}

      {/* Header */}
      <PageHeader
        title="Diary"
        onMediaAdded={refreshEntries}
        filterBar={
          <MovieDiaryStickyBar
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            onJumpToSection={scrollToSection}
            sectionJumps={sectionJumps}
            activeSection={activeSection}
          />
        }
      />

      {/* Main Content */}
      <main id="main-content" tabIndex={-1} className="p-4 sm:p-6 relative outline-none">
        <section id="watching" ref={watchingSectionRef}>
          <WatchingSection
            entries={filteredWatching}
            loading={watchingLoading}
            onUpdate={handleWatchingEntryUpdate}
            onDelete={handleDelete}
          />
        </section>

        {allEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Calendar className="h-12 w-12 opacity-30 mb-4" />
            <p className="text-sm font-mono mb-3">No entries yet</p>
            <p className="text-sm text-center mb-4">Start tracking the films, shows, books, and games you care about.</p>
            <Button onClick={() => setShowAddDialog(true)}>Add your first entry</Button>
          </div>
        ) : (
          <>
            {/* Watched (Diary) */}
            <section id="watched" ref={watchedSectionRef} className="mb-8">
              <button
                type="button"
                className="flex items-center gap-2 mb-3 hover:opacity-80 transition-opacity"
                onClick={() => setWatchedCollapsed(!watchedCollapsed)}
              >
                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${watchedCollapsed ? "-rotate-90" : ""}`} />
                <Calendar className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Watched</h2>
                {watchedEntries.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    ({filteredWatched.length !== watchedEntries.length ? `${filteredWatched.length} of ${watchedEntries.length}` : watchedEntries.length})
                  </span>
                )}
              </button>
              <div className={`collapsible-panel ${watchedCollapsed ? "collapsible-closed" : "collapsible-open"}`}>
                <div className="collapsible-inner">
                  {watchedEntries.length > 0 && (
                    <>
                      <GlobalFilterBar
                        filters={filters}
                        onFiltersChange={setFilters}
                        options={filterOptions}
                        totalCount={watchedEntries.length}
                        filteredCount={filteredWatched.length}
                      />
                      <div className="mb-6 mt-4 space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            variant={showSelectMode ? "secondary" : "outline"}
                            size="sm"
                            className="gap-2"
                            onClick={() => setShowSelectMode(!showSelectMode)}
                          >
                            <CheckSquare className="h-4 w-4" />
                            <span className="hidden sm:inline">{showSelectMode ? "Cancel Selection" : "Select"}</span>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="gap-2 hidden sm:flex">
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
                                  onCheckedChange={() => toggleColumn(key as ColumnKey)}
                                >
                                  {def.label}
                                </DropdownMenuCheckboxItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </>
                  )}
                  <div className="transition-opacity duration-200" style={{ opacity: loading ? 0.5 : 1 }}>
                    <MediaTable
                      entries={filteredWatched}
                      onDelete={handleDelete}
                      onEntryUpdate={updateEntryInList}
                      onRefresh={refreshEntries}
                      showSelectMode={showSelectMode}
                      onSelectModeChange={setShowSelectMode}
                      diaryDateField="finish_date"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Planned */}
            <section id="planned" ref={plannedSectionRef} className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <button
                  type="button"
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  onClick={() => setPlannedCollapsed(!plannedCollapsed)}
                >
                  <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${plannedCollapsed ? "-rotate-90" : ""}`} />
                  <ListTodo className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Planned</h2>
                  {plannedEntries.length > 0 && (
                    <span className="text-sm text-muted-foreground">
                      ({filteredPlanned.length !== plannedEntries.length ? `${filteredPlanned.length} of ${plannedEntries.length}` : plannedEntries.length})
                    </span>
                  )}
                </button>
                {plannedEntries.length > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={handlePickRandomPlanned}
                    title="Pick random to watch"
                    aria-label="Pick a random planned item to watch"
                  >
                    <Shuffle className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className={`collapsible-panel ${plannedCollapsed ? "collapsible-closed" : "collapsible-open"}`}>
                <div className="collapsible-inner">
                  <div className="transition-opacity duration-200" style={{ opacity: loading ? 0.5 : 1 }}>
                    <MediaTable
                      entries={filteredPlanned}
                      onDelete={handleDelete}
                      onEntryUpdate={updateEntryInList}
                      onRefresh={refreshEntries}
                      entryToOpenId={entryToOpenId}
                      onOpenDetailsDone={() => setEntryToOpenId(null)}
                    />
                  </div>
                </div>
              </div>
            </section>

            <WatchThisDialog
              entry={watchThisEntry}
              open={!!watchThisEntry}
              onOpenChange={(open) => !open && setWatchThisEntry(null)}
              onOpenInDiary={(entry) => {
                setWatchThisEntry(null)
                setEntryToOpenId(entry.id)
              }}
            />

            {/* On Hold & Dropped */}
            <section id="hold-dropped" ref={holdDroppedSectionRef}>
              <button
                type="button"
                className="flex items-center gap-2 mb-3 hover:opacity-80 transition-opacity"
                onClick={() => setHoldDroppedCollapsed(!holdDroppedCollapsed)}
              >
                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${holdDroppedCollapsed ? "-rotate-90" : ""}`} />
                <Pause className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">On Hold & Dropped</h2>
                {holdAndDroppedEntries.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    ({filteredHoldAndDropped.length !== holdAndDroppedEntries.length ? `${filteredHoldAndDropped.length} of ${holdAndDroppedEntries.length}` : holdAndDroppedEntries.length})
                  </span>
                )}
              </button>
              <div className={`collapsible-panel ${holdDroppedCollapsed ? "collapsible-closed" : "collapsible-open"}`}>
                <div className="collapsible-inner">
                  <div className="transition-opacity duration-200" style={{ opacity: loading ? 0.5 : 1 }}>
                    <MediaTable
                      entries={filteredHoldAndDropped}
                      onDelete={handleDelete}
                      onEntryUpdate={updateEntryInList}
                      onRefresh={refreshEntries}
                    />
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        <MediaDetailsDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          entry={null}
          onSuccess={() => {
            setShowAddDialog(false)
            refreshEntries()
          }}
        />
      </main>
    </div>
  )
}

export default function EntriesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background page-content">
        <PageHeader title="Diary" />
        <DiaryPageSkeleton />
      </div>
    }>
      <EntriesPageContent />
    </Suspense>
  )
}
