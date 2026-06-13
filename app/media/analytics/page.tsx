"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import dynamic from "next/dynamic"
import { getEntries } from "@/lib/actions"
import { MediaEntry } from "@/lib/database.types"
import { FilterState, defaultFilterState, applyFilters, extractFilterOptions } from "@/lib/filter-types"
import { useMediaMetrics } from "@/hooks/useMediaMetrics"
import { GlobalFilterBar } from "@/components/analytics/GlobalFilterBar"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { AnalyticsSkeleton, KPIGridSkeleton, ChartGridSkeleton } from "@/components/skeletons"
import { PageHeader } from "@/components/page-header"

// Dynamic imports for chart components - reduces initial bundle size
const KPIGrid = dynamic(
  () => import("@/components/analytics/KPIGrid").then(m => m.KPIGrid),
  {
    loading: () => <KPIGridSkeleton />,
    ssr: false
  }
)

const AnalyticsCharts = dynamic(
  () => import("@/components/analytics/AnalyticsCharts").then(m => m.AnalyticsCharts),
  {
    loading: () => <ChartGridSkeleton />,
    ssr: false
  }
)

const MediaDetailsDialog = dynamic(
  () => import("@/components/media-details-dialog").then(m => m.MediaDetailsDialog),
  { ssr: false }
)

export default function AnalyticsPage() {
  const [entries, setEntries] = useState<MediaEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterState>(defaultFilterState)
  const [showAddDialog, setShowAddDialog] = useState(false)

  const loadEntries = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Use optimized server action instead of direct Supabase query
      const result = await getEntries()

      if (!result.success) {
        throw new Error(result.error || "Failed to load entries")
      }

      setEntries(result.data || [])
    } catch (err) {
      console.error("Failed to fetch entries:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to load entries"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEntries()
  }, [loadEntries])

  // Extract filter options from raw data
  const filterOptions = useMemo(() => extractFilterOptions(entries), [entries])

  // Apply filters to entries
  const filteredEntries = useMemo(() => applyFilters(entries, filters), [entries, filters])

  // Calculate metrics from filtered entries
  const metrics = useMediaMetrics(filteredEntries)

  if (loading) {
    return (
      <div className="min-h-screen bg-background page-content">
        <PageHeader title="Analytics" />
        <main id="main-content" tabIndex={-1} className="p-4 sm:p-6 outline-none">
          <AnalyticsSkeleton />
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm font-mono text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={() => loadEntries()}>
            Try again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background page-content">
      <PageHeader
        title="Analytics"
        filterBar={entries.length > 0 ? (
          <GlobalFilterBar
            filters={filters}
            onFiltersChange={setFilters}
            options={filterOptions}
            totalCount={entries.length}
            filteredCount={filteredEntries.length}
          />
        ) : undefined}
      />

      {/* Main Content */}
      <main id="main-content" tabIndex={-1} className="p-4 sm:p-6 outline-none">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <AlertCircle className="h-12 w-12 opacity-30 mb-4" />
            <p className="text-sm font-mono mb-3">No entries yet</p>
            <p className="text-sm text-center mb-4">Add your first entry to start seeing your stats and charts.</p>
            <Button onClick={() => setShowAddDialog(true)}>Add your first entry</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPI Grid */}
            <KPIGrid metrics={metrics} />

            {/* Charts */}
            <AnalyticsCharts metrics={metrics} />
          </div>
        )}

        <MediaDetailsDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          entry={null}
          onSuccess={() => {
            setShowAddDialog(false)
            loadEntries()
          }}
        />
      </main>
    </div>
  )
}
