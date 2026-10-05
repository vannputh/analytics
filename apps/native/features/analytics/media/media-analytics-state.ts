import {
  applyFilters,
  extractFilterOptions,
  type FilterState,
  type MediaEntry,
} from "@analytics/domain"

export type MediaAnalyticsFilterGroupKey = Exclude<keyof FilterState, "dateFrom" | "dateTo">

export interface MediaAnalyticsFilterGroupConfig {
  key: MediaAnalyticsFilterGroupKey
  title: string
}

export interface DerivedMediaAnalyticsState {
  activeFilterCount: number
  filterOptions: ReturnType<typeof extractFilterOptions>
  filteredEntries: MediaEntry[]
  filteredCount: number
  hasActiveFilters: boolean
  totalCount: number
}

export const MEDIA_ANALYTICS_FILTER_GROUPS: MediaAnalyticsFilterGroupConfig[] = [
  { key: "genres", title: "Genres" },
  { key: "mediums", title: "Mediums" },
  { key: "languages", title: "Languages" },
  { key: "platforms", title: "Platforms" },
  { key: "statuses", title: "Statuses" },
  { key: "types", title: "Types" },
]

export function createDefaultMediaAnalyticsFilters(): FilterState {
  return {
    dateFrom: null,
    dateTo: null,
    genres: [],
    mediums: [],
    languages: [],
    platforms: [],
    statuses: [],
    types: [],
  }
}

export function resetMediaAnalyticsFilters(): FilterState {
  return createDefaultMediaAnalyticsFilters()
}

export function getMediaAnalyticsFilterGroupConfig(groupKey: string) {
  return MEDIA_ANALYTICS_FILTER_GROUPS.find((group) => group.key === groupKey) ?? null
}

export function isMediaAnalyticsFilterGroupKey(
  value: string,
): value is MediaAnalyticsFilterGroupKey {
  return MEDIA_ANALYTICS_FILTER_GROUPS.some((group) => group.key === value)
}

export function summarizeMediaAnalyticsFilterGroupSelection(
  filters: FilterState,
  groupKey: MediaAnalyticsFilterGroupKey,
) {
  const values = filters[groupKey]

  if (values.length === 0) {
    return "Any"
  }

  if (values.length <= 2) {
    return values.join(", ")
  }

  return `${values.length} selected`
}

export function toggleMediaAnalyticsFilterValue(
  filters: FilterState,
  groupKey: MediaAnalyticsFilterGroupKey,
  value: string,
): FilterState {
  const values = filters[groupKey]
  const nextValues = values.includes(value)
    ? values.filter((currentValue) => currentValue !== value)
    : [...values, value]

  return {
    ...filters,
    [groupKey]: nextValues,
  }
}

export function clearMediaAnalyticsFilterGroup(
  filters: FilterState,
  groupKey: MediaAnalyticsFilterGroupKey,
): FilterState {
  return {
    ...filters,
    [groupKey]: [],
  }
}

function countActiveFilters(filters: FilterState) {
  return [
    filters.dateFrom || filters.dateTo ? 1 : 0,
    filters.genres.length,
    filters.mediums.length,
    filters.languages.length,
    filters.platforms.length,
    filters.statuses.length,
    filters.types.length,
  ].reduce((total, count) => total + count, 0)
}

export function deriveMediaAnalyticsState(
  allEntries: MediaEntry[],
  filters: FilterState,
): DerivedMediaAnalyticsState {
  const filteredEntries = applyFilters(allEntries, filters)
  const activeFilterCount = countActiveFilters(filters)

  return {
    activeFilterCount,
    filterOptions: extractFilterOptions(allEntries),
    filteredEntries,
    filteredCount: filteredEntries.length,
    hasActiveFilters: activeFilterCount > 0,
    totalCount: allEntries.length,
  }
}
