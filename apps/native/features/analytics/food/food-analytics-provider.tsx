import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react"

import { createFoodRepository } from "@analytics/data"
import type { FoodAnalyticsDrillDown, FoodEntry, FoodFilterState, FoodMetrics } from "@analytics/domain"
import {
  filterFoodEntriesByDrillDown,
  groupFoodEntriesByPlace,
  mapFoodAnalyticsChartItemToDrillDown,
} from "@analytics/domain"
import { useFoodMetrics } from "@analytics/hooks"

import {
  createFoodAnalyticsBreakdownSections,
  createFoodAnalyticsKpis,
  createFoodAnalyticsMonthlySections,
} from "@/features/analytics/food/food-analytics-presentation"
import {
  createDefaultFoodAnalyticsFilters,
  deriveFoodAnalyticsState,
  type DerivedFoodAnalyticsState,
} from "@/features/analytics/food/food-analytics-state"
import type {
  AnalyticsBreakdownSectionModel,
  AnalyticsKpiModel,
  AnalyticsMonthlySectionModel,
} from "@/features/analytics/shared/analytics-models"
import { getNativeConfigurationError } from "@/lib/config"
import { supabase } from "@/lib/supabase"

interface FoodAnalyticsContextValue extends DerivedFoodAnalyticsState {
  breakdownSections: AnalyticsBreakdownSectionModel[]
  clearDrillDown(): void
  drillDown: FoodAnalyticsDrillDown | null
  drillDownEntries: FoodEntry[]
  drillDownGroups: ReturnType<typeof groupFoodEntriesByPlace>
  error: string | null
  filters: FoodFilterState
  kpis: AnalyticsKpiModel[]
  loading: boolean
  metrics: FoodMetrics
  monthlySections: AnalyticsMonthlySectionModel[]
  refreshEntries(): Promise<void>
  refreshing: boolean
  resetFilters(): void
  selectChartItem(sectionKey: string, item: { key: string; label: string }): void
  setFilters: Dispatch<SetStateAction<FoodFilterState>>
}

const FoodAnalyticsContext = createContext<FoodAnalyticsContextValue | null>(null)

export function FoodAnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [allEntries, setAllEntries] = useState<FoodEntry[]>([])
  const [filters, setFilters] = useState<FoodFilterState>(createDefaultFoodAnalyticsFilters)
  const [drillDown, setDrillDown] = useState<FoodAnalyticsDrillDown | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const configurationError = getNativeConfigurationError()
  const repository = useMemo(() => (supabase ? createFoodRepository(supabase) : null), [])

  const refreshEntries = useCallback(async (options?: { silent?: boolean }) => {
    if (!repository) {
      setError(configurationError ?? "Native configuration is incomplete.")
      setLoading(false)
      setRefreshing(false)
      return
    }

    if (options?.silent) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      setError(null)
      const entries = await repository.getEntries({ projection: "analytics" })
      setAllEntries(entries)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load food analytics.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [configurationError, repository])

  useEffect(() => {
    void refreshEntries()
  }, [refreshEntries])

  const derivedState = useMemo(
    () => deriveFoodAnalyticsState(allEntries, filters),
    [allEntries, filters],
  )
  const drillDownEntries = useMemo(
    () => (drillDown ? filterFoodEntriesByDrillDown(derivedState.filteredEntries, drillDown) : []),
    [derivedState.filteredEntries, drillDown],
  )
  const drillDownGroups = useMemo(
    () => (drillDown ? groupFoodEntriesByPlace(drillDownEntries) : []),
    [drillDown, drillDownEntries],
  )
  const metrics = useFoodMetrics(derivedState.filteredEntries)
  const kpis = useMemo(() => createFoodAnalyticsKpis(metrics), [metrics])
  const monthlySections = useMemo(() => createFoodAnalyticsMonthlySections(metrics), [metrics])
  const breakdownSections = useMemo(
    () => createFoodAnalyticsBreakdownSections(metrics),
    [metrics],
  )

  const resetFilters = useCallback(() => {
    setFilters(createDefaultFoodAnalyticsFilters())
  }, [])

  const clearDrillDown = useCallback(() => {
    setDrillDown(null)
  }, [])

  const selectChartItem = useCallback((sectionKey: string, item: { key: string; label: string }) => {
    const nextDrillDown = mapFoodAnalyticsChartItemToDrillDown(sectionKey, item)
    if (nextDrillDown) {
      setDrillDown(nextDrillDown)
    }
  }, [])

  const value = useMemo<FoodAnalyticsContextValue>(
    () => ({
      ...derivedState,
      breakdownSections,
      clearDrillDown,
      drillDown,
      drillDownEntries,
      drillDownGroups,
      error,
      filters,
      kpis,
      loading,
      metrics,
      monthlySections,
      refreshEntries: () => refreshEntries({ silent: true }),
      refreshing,
      resetFilters,
      selectChartItem,
      setFilters,
    }),
    [
      breakdownSections,
      clearDrillDown,
      derivedState,
      drillDown,
      drillDownEntries,
      drillDownGroups,
      error,
      filters,
      kpis,
      loading,
      metrics,
      monthlySections,
      refreshEntries,
      refreshing,
      resetFilters,
      selectChartItem,
    ],
  )

  return <FoodAnalyticsContext.Provider value={value}>{children}</FoodAnalyticsContext.Provider>
}

export function useFoodAnalytics() {
  const context = useContext(FoodAnalyticsContext)

  if (!context) {
    throw new Error("useFoodAnalytics must be used inside FoodAnalyticsProvider.")
  }

  return context
}
