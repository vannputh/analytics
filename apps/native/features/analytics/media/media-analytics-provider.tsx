import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react"

import type { FilterState, MediaMetrics } from "@analytics/domain"
import { useMediaMetrics } from "@analytics/hooks"

import { useMediaDiary } from "@/features/media/media-diary-provider"
import {
  createMediaAnalyticsBreakdownSections,
  createMediaAnalyticsKpis,
  createMediaAnalyticsMonthlySections,
  type MediaAnalyticsBreakdownSectionModel,
  type MediaAnalyticsKpiModel,
  type MediaAnalyticsMonthlySectionModel,
} from "@/features/analytics/media/media-analytics-presentation"
import {
  createDefaultMediaAnalyticsFilters,
  deriveMediaAnalyticsState,
  type DerivedMediaAnalyticsState,
} from "@/features/analytics/media/media-analytics-state"

interface MediaAnalyticsContextValue extends DerivedMediaAnalyticsState {
  breakdownSections: MediaAnalyticsBreakdownSectionModel[]
  error: string | null
  filters: FilterState
  kpis: MediaAnalyticsKpiModel[]
  loading: boolean
  metrics: MediaMetrics
  monthlySections: MediaAnalyticsMonthlySectionModel[]
  refreshEntries(): Promise<void>
  refreshing: boolean
  resetFilters(): void
  setFilters: Dispatch<SetStateAction<FilterState>>
}

const MediaAnalyticsContext = createContext<MediaAnalyticsContextValue | null>(null)

export function MediaAnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { allEntries, error, loading, refreshEntries, refreshing } = useMediaDiary()
  const [filters, setFilters] = useState<FilterState>(createDefaultMediaAnalyticsFilters)

  const derivedState = useMemo(
    () => deriveMediaAnalyticsState(allEntries, filters),
    [allEntries, filters],
  )
  const metrics = useMediaMetrics(derivedState.filteredEntries)
  const kpis = useMemo(() => createMediaAnalyticsKpis(metrics), [metrics])
  const monthlySections = useMemo(() => createMediaAnalyticsMonthlySections(metrics), [metrics])
  const breakdownSections = useMemo(
    () => createMediaAnalyticsBreakdownSections(metrics),
    [metrics],
  )

  const resetFilters = useCallback(() => {
    setFilters(createDefaultMediaAnalyticsFilters())
  }, [])

  const value = useMemo<MediaAnalyticsContextValue>(
    () => ({
      ...derivedState,
      breakdownSections,
      error,
      filters,
      kpis,
      loading,
      metrics,
      monthlySections,
      refreshEntries,
      refreshing,
      resetFilters,
      setFilters,
    }),
    [
      breakdownSections,
      derivedState,
      error,
      filters,
      kpis,
      loading,
      metrics,
      monthlySections,
      refreshEntries,
      refreshing,
      resetFilters,
    ],
  )

  return (
    <MediaAnalyticsContext.Provider value={value}>
      {children}
    </MediaAnalyticsContext.Provider>
  )
}

export function useMediaAnalytics() {
  const context = useContext(MediaAnalyticsContext)

  if (!context) {
    throw new Error("useMediaAnalytics must be used inside MediaAnalyticsProvider.")
  }

  return context
}
