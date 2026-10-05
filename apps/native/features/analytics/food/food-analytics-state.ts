import {
  defaultFoodFilterState,
  filterFoodEntriesForAnalytics,
  type FoodEntry,
  type FoodFilterState,
} from "@analytics/domain"

export type FoodAnalyticsFilterGroupKey = "categories" | "cuisineTypes" | "cities" | "diningTypes"

export interface FoodAnalyticsFilterGroupConfig {
  key: FoodAnalyticsFilterGroupKey
  title: string
}

export interface FoodAnalyticsFilterOptions {
  categories: string[]
  cities: string[]
  cuisineTypes: string[]
  diningTypes: string[]
}

export interface DerivedFoodAnalyticsState {
  activeFilterCount: number
  filterOptions: FoodAnalyticsFilterOptions
  filteredEntries: FoodEntry[]
  filteredCount: number
  hasActiveFilters: boolean
  totalCount: number
}

export const FOOD_ANALYTICS_FILTER_GROUPS: FoodAnalyticsFilterGroupConfig[] = [
  { key: "categories", title: "Categories" },
  { key: "cuisineTypes", title: "Cuisines" },
  { key: "cities", title: "Cities" },
  { key: "diningTypes", title: "Dining" },
]

export function createDefaultFoodAnalyticsFilters(): FoodFilterState {
  return {
    ...defaultFoodFilterState,
    categories: [],
    cuisineTypes: [],
    itemCategories: [],
    priceLevels: [],
    diningTypes: [],
    cities: [],
  }
}

export function resetFoodAnalyticsFilters(): FoodFilterState {
  return createDefaultFoodAnalyticsFilters()
}

export function getFoodAnalyticsFilterGroupConfig(groupKey: string) {
  return FOOD_ANALYTICS_FILTER_GROUPS.find((group) => group.key === groupKey) ?? null
}

export function isFoodAnalyticsFilterGroupKey(
  value: string,
): value is FoodAnalyticsFilterGroupKey {
  return FOOD_ANALYTICS_FILTER_GROUPS.some((group) => group.key === value)
}

export function summarizeFoodAnalyticsFilterGroupSelection(
  filters: FoodFilterState,
  groupKey: FoodAnalyticsFilterGroupKey,
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

export function toggleFoodAnalyticsFilterValue(
  filters: FoodFilterState,
  groupKey: FoodAnalyticsFilterGroupKey,
  value: string,
): FoodFilterState {
  const values = filters[groupKey]
  const nextValues = values.includes(value)
    ? values.filter((currentValue) => currentValue !== value)
    : [...values, value]

  return {
    ...filters,
    [groupKey]: nextValues,
  }
}

export function clearFoodAnalyticsFilterGroup(
  filters: FoodFilterState,
  groupKey: FoodAnalyticsFilterGroupKey,
): FoodFilterState {
  return {
    ...filters,
    [groupKey]: [],
  }
}

function uniqueSorted(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => value?.trim()).filter(Boolean) as string[])).sort()
}

export function extractFoodAnalyticsFilterOptions(entries: FoodEntry[]): FoodAnalyticsFilterOptions {
  return {
    categories: uniqueSorted(entries.map((entry) => entry.category)),
    cities: uniqueSorted(entries.map((entry) => entry.city)),
    cuisineTypes: uniqueSorted(entries.flatMap((entry) => entry.cuisine_type ?? [])),
    diningTypes: uniqueSorted(entries.map((entry) => entry.dining_type)),
  }
}

function countActiveFilters(filters: FoodFilterState) {
  return [
    filters.dateFrom || filters.dateTo ? 1 : 0,
    filters.categories.length,
    filters.cuisineTypes.length,
    filters.cities.length,
    filters.diningTypes.length,
    filters.itemCategories.length,
    filters.priceLevels.length,
    filters.minRating ? 1 : 0,
    filters.wouldReturn !== null ? 1 : 0,
  ].reduce((total, count) => total + count, 0)
}

export function deriveFoodAnalyticsState(
  allEntries: FoodEntry[],
  filters: FoodFilterState,
): DerivedFoodAnalyticsState {
  const filteredEntries = filterFoodEntriesForAnalytics(allEntries, filters)
  const activeFilterCount = countActiveFilters(filters)

  return {
    activeFilterCount,
    filterOptions: extractFoodAnalyticsFilterOptions(allEntries),
    filteredEntries,
    filteredCount: filteredEntries.length,
    hasActiveFilters: activeFilterCount > 0,
    totalCount: allEntries.length,
  }
}
