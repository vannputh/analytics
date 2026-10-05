import type { FoodEntry } from "./database.types"
import type { FoodFilterState } from "./food-types"
import { getMonthBucketKey } from "./analytics-date"

export interface FoodMetrics {
  totalVisits: number
  uniquePlaces: number
  wouldReturnCount: number
  totalSpent: number
  averagePrice: number
  spentByMonth: { month: string; amount: number }[]
  spentByCuisine: Record<string, number>
  spentByItemCategory: Record<string, number>
  averageRating: number
  averageFoodRating: number
  averageAmbianceRating: number
  averageServiceRating: number
  averageValueRating: number
  ratingDistribution: { rating: number; count: number }[]
  countByMonth: { month: string; count: number }[]
  countByCuisine: Record<string, number>
  countByCity: Record<string, number>
  countByNeighborhood: Record<string, number>
  countByCategory: Record<string, number>
  countByPriceLevel: Record<string, number>
  countByTag: Record<string, number>
  countByItemCategory: Record<string, number>
  countByDiningType: Record<string, number>
  topCuisine: string | null
  topCity: string | null
  topNeighborhood: string | null
  topCategory: string | null
  topItemCategory: string | null
  topDiningType: string | null
  mostVisitedPlaces: { name: string; count: number; avgRating: number }[]
  recentEntries: FoodEntry[]
}

export type FoodAnalyticsDrillDownDimension =
  | "category"
  | "city"
  | "cuisine"
  | "diningType"
  | "itemCategory"
  | "month"
  | "neighborhood"
  | "place"
  | "rating"
  | "tag"

export interface FoodAnalyticsDrillDown {
  dimension: FoodAnalyticsDrillDownDimension
  label: string
  value: string
}

export interface FoodAnalyticsPlaceGroup {
  entries: FoodEntry[]
  placeName: string
}

export type FoodAnalyticsChartSectionKey =
  | "visits"
  | "spending"
  | "cuisines"
  | "cities"
  | "categories"
  | "dining"

const FOOD_ANALYTICS_CHART_DIMENSIONS: Record<
  FoodAnalyticsChartSectionKey,
  FoodAnalyticsDrillDownDimension
> = {
  visits: "month",
  spending: "month",
  cuisines: "cuisine",
  cities: "city",
  categories: "category",
  dining: "diningType",
}

export function isFoodAnalyticsChartSectionKey(
  value: string,
): value is FoodAnalyticsChartSectionKey {
  return value in FOOD_ANALYTICS_CHART_DIMENSIONS
}

export function mapFoodAnalyticsChartItemToDrillDown(
  sectionKey: string,
  item: { key: string; label: string },
): FoodAnalyticsDrillDown | null {
  if (!isFoodAnalyticsChartSectionKey(sectionKey) || !item.key) {
    return null
  }

  return {
    dimension: FOOD_ANALYTICS_CHART_DIMENSIONS[sectionKey],
    label: item.label,
    value: item.key,
  }
}

/**
 * Columns required to filter, aggregate, and drill into food analytics.
 * Long text and map payloads stay off this read path.
 */
export const FOOD_ANALYTICS_ENTRY_COLUMNS = [
  "ambiance_rating",
  "branch",
  "category",
  "city",
  "cuisine_type",
  "dining_type",
  "food_rating",
  "id",
  "items_ordered",
  "name",
  "neighborhood",
  "overall_rating",
  "price_level",
  "service_rating",
  "tags",
  "total_price",
  "value_rating",
  "visit_date",
  "would_return",
] as const

export const FOOD_ANALYTICS_ENTRY_SELECT = FOOD_ANALYTICS_ENTRY_COLUMNS.join(",")

function compareVisitDateDesc(left: string | null | undefined, right: string | null | undefined) {
  const leftKey = left ?? ""
  const rightKey = right ?? ""
  if (leftKey === rightKey) return 0
  if (!leftKey) return 1
  if (!rightKey) return -1
  return leftKey < rightKey ? 1 : -1
}

function takeRecentEntries(data: FoodEntry[], limit: number): FoodEntry[] {
  const recent: FoodEntry[] = []

  for (const entry of data) {
    const visitDate = entry.visit_date ?? ""
    let insertAt = recent.findIndex((candidate) => (candidate.visit_date ?? "") < visitDate)

    if (insertAt === -1) {
      if (recent.length < limit) {
        recent.push(entry)
      }
      continue
    }

    recent.splice(insertAt, 0, entry)
    if (recent.length > limit) {
      recent.pop()
    }
  }

  return recent
}

function getTopEntry(record: Record<string, number>): string | null {
  const entries = Object.entries(record)
  if (entries.length === 0) return null
  return entries.reduce((left, right) => (left[1] > right[1] ? left : right))[0]
}

function incrementRecord(
  record: Record<string, number>,
  key: string | null | undefined,
  amount = 1,
) {
  if (!key) return
  record[key] = (record[key] || 0) + amount
}

function getItemCategories(entry: FoodEntry): string[] {
  return (entry.items_ordered || []).flatMap((item) =>
    item.categories?.length ? item.categories : item.category ? [item.category] : [],
  )
}

export function filterFoodEntriesForAnalytics(
  entries: FoodEntry[],
  filters: FoodFilterState,
): FoodEntry[] {
  return entries.filter((entry) => {
    if (filters.dateFrom && entry.visit_date < filters.dateFrom) return false
    if (filters.dateTo && entry.visit_date > filters.dateTo) return false

    if (filters.itemCategories.length > 0) {
      const categories = getItemCategories(entry)
      if (!filters.itemCategories.some((category) => categories.includes(category))) {
        return false
      }
    }

    if (filters.cities.length > 0) {
      if (!entry.city || !filters.cities.includes(entry.city)) return false
    }

    if (filters.cuisineTypes.length > 0) {
      const cuisines = entry.cuisine_type || []
      if (!filters.cuisineTypes.some((cuisine) => cuisines.includes(cuisine))) {
        return false
      }
    }

    if (filters.categories.length > 0) {
      if (!entry.category || !filters.categories.includes(entry.category)) return false
    }

    if (filters.priceLevels.length > 0) {
      if (!entry.price_level || !filters.priceLevels.includes(entry.price_level)) return false
    }

    if (filters.diningTypes.length > 0) {
      if (!entry.dining_type || !filters.diningTypes.includes(entry.dining_type)) return false
    }

    if (filters.minRating !== null) {
      if (!entry.overall_rating || entry.overall_rating < filters.minRating) return false
    }

    if (filters.wouldReturn !== null) {
      if (entry.would_return !== filters.wouldReturn) return false
    }

    return true
  })
}

export function filterFoodEntriesByDrillDown(
  entries: FoodEntry[],
  drillDown: FoodAnalyticsDrillDown,
): FoodEntry[] {
  return entries.filter((entry) => {
    switch (drillDown.dimension) {
      case "cuisine":
        return entry.cuisine_type?.includes(drillDown.value) ?? false
      case "category":
        return entry.category === drillDown.value
      case "itemCategory":
        return getItemCategories(entry).includes(drillDown.value)
      case "place":
        return entry.name === drillDown.value
      case "city":
        return entry.city === drillDown.value
      case "neighborhood":
        return entry.neighborhood === drillDown.value
      case "tag":
        return entry.tags?.includes(drillDown.value) ?? false
      case "diningType":
        return entry.dining_type === drillDown.value
      case "rating":
        return Math.floor(entry.overall_rating ?? 0) === Number(drillDown.value)
      case "month":
        return getMonthBucketKey(entry.visit_date) === drillDown.value
      default:
        return false
    }
  })
}

export function groupFoodEntriesByPlace(entries: FoodEntry[]): FoodAnalyticsPlaceGroup[] {
  const groupedEntries = new Map<string, FoodEntry[]>()

  for (const entry of entries) {
    const placeName = entry.name || ""
    if (!groupedEntries.has(placeName)) {
      groupedEntries.set(placeName, [])
    }
    groupedEntries.get(placeName)?.push(entry)
  }

  const groups: FoodAnalyticsPlaceGroup[] = []
  groupedEntries.forEach((groupEntries, placeName) => {
    const sortedEntries = [...groupEntries].sort((left, right) =>
      compareVisitDateDesc(left.visit_date, right.visit_date),
    )
    groups.push({ placeName, entries: sortedEntries })
  })

  return groups.sort((left, right) =>
    compareVisitDateDesc(left.entries[0]?.visit_date, right.entries[0]?.visit_date),
  )
}

export function calculateFoodMetrics(data: FoodEntry[]): FoodMetrics {
  let totalSpent = 0
  let totalRatingSum = 0
  let ratedItemCount = 0
  let totalFoodRatingSum = 0
  let foodRatingCount = 0
  let totalAmbianceRatingSum = 0
  let ambianceRatingCount = 0
  let totalServiceRatingSum = 0
  let serviceRatingCount = 0
  let totalValueRatingSum = 0
  let valueRatingCount = 0
  let wouldReturnCount = 0

  const spentByMonthMap: Record<string, number> = {}
  const spentByCuisine: Record<string, number> = {}
  const spentByItemCategory: Record<string, number> = {}
  const countByMonthMap: Record<string, number> = {}
  const countByCuisine: Record<string, number> = {}
  const countByCity: Record<string, number> = {}
  const countByNeighborhood: Record<string, number> = {}
  const countByCategory: Record<string, number> = {}
  const countByPriceLevel: Record<string, number> = {}
  const countByTag: Record<string, number> = {}
  const countByItemCategory: Record<string, number> = {}
  const countByDiningType: Record<string, number> = {}
  const ratingBuckets: Record<number, number> = {}
  const placeVisits: Record<string, { count: number; totalRating: number; ratingCount: number }> = {}
  const uniquePlaces = new Set<string>()

  for (const entry of data) {
    const month = getMonthBucketKey(entry.visit_date)
    uniquePlaces.add(entry.name)

    if (!placeVisits[entry.name]) {
      placeVisits[entry.name] = { count: 0, totalRating: 0, ratingCount: 0 }
    }
    placeVisits[entry.name].count += 1
    if (entry.overall_rating) {
      placeVisits[entry.name].totalRating += entry.overall_rating
      placeVisits[entry.name].ratingCount += 1
    }

    if (entry.would_return) {
      wouldReturnCount += 1
    }

    const price = entry.total_price
    if (price !== null && price !== undefined && price > 0) {
      totalSpent += price

      if (month) {
        spentByMonthMap[month] = (spentByMonthMap[month] || 0) + price
      }

      if (entry.cuisine_type && Array.isArray(entry.cuisine_type)) {
        const perCuisinePrice = price / entry.cuisine_type.length
        for (const cuisine of entry.cuisine_type) {
          incrementRecord(spentByCuisine, cuisine.trim(), perCuisinePrice)
        }
      }

      if (entry.items_ordered && Array.isArray(entry.items_ordered)) {
        for (const item of entry.items_ordered) {
          const categories = item.categories?.length
            ? item.categories
            : item.category
              ? [item.category]
              : []

          if (categories.length > 0 && item.price) {
            const perCategoryPrice = item.price / categories.length
            for (const category of categories) {
              incrementRecord(spentByItemCategory, category, perCategoryPrice)
            }
          }
        }
      }
    }

    incrementRecord(countByCity, entry.city)
    incrementRecord(countByNeighborhood, entry.neighborhood)
    incrementRecord(countByCategory, entry.category)
    incrementRecord(countByPriceLevel, entry.price_level)
    incrementRecord(countByDiningType, entry.dining_type)

    if (month) {
      incrementRecord(countByMonthMap, month)
    }

    if (entry.cuisine_type && Array.isArray(entry.cuisine_type)) {
      for (const cuisine of entry.cuisine_type) {
        incrementRecord(countByCuisine, cuisine.trim())
      }
    }

    if (entry.tags && Array.isArray(entry.tags)) {
      for (const tag of entry.tags) {
        incrementRecord(countByTag, tag.trim())
      }
    }

    if (entry.items_ordered && Array.isArray(entry.items_ordered)) {
      for (const item of entry.items_ordered) {
        const categories = item.categories?.length
          ? item.categories
          : item.category
            ? [item.category]
            : []

        for (const category of categories) {
          incrementRecord(countByItemCategory, category)
        }
      }
    }

    if (entry.overall_rating !== null && entry.overall_rating !== undefined) {
      totalRatingSum += entry.overall_rating
      ratedItemCount += 1
      const bucket = Math.floor(entry.overall_rating)
      ratingBuckets[bucket] = (ratingBuckets[bucket] || 0) + 1
    }

    if (entry.food_rating) {
      totalFoodRatingSum += entry.food_rating
      foodRatingCount += 1
    }
    if (entry.ambiance_rating) {
      totalAmbianceRatingSum += entry.ambiance_rating
      ambianceRatingCount += 1
    }
    if (entry.service_rating) {
      totalServiceRatingSum += entry.service_rating
      serviceRatingCount += 1
    }
    if (entry.value_rating) {
      totalValueRatingSum += entry.value_rating
      valueRatingCount += 1
    }
  }

  const spentByMonth = Object.entries(spentByMonthMap)
    .map(([month, amount]) => ({ month, amount }))
    .sort((left, right) => left.month.localeCompare(right.month))

  const countByMonth = Object.entries(countByMonthMap)
    .map(([month, count]) => ({ month, count }))
    .sort((left, right) => left.month.localeCompare(right.month))

  const ratingDistribution = Object.entries(ratingBuckets)
    .map(([rating, count]) => ({ rating: Number.parseInt(rating, 10), count }))
    .sort((left, right) => left.rating - right.rating)

  const averagePrice = data.length > 0 ? totalSpent / data.length : 0
  const averageRating = ratedItemCount > 0 ? totalRatingSum / ratedItemCount : 0
  const averageFoodRating = foodRatingCount > 0 ? totalFoodRatingSum / foodRatingCount : 0
  const averageAmbianceRating = ambianceRatingCount > 0 ? totalAmbianceRatingSum / ambianceRatingCount : 0
  const averageServiceRating = serviceRatingCount > 0 ? totalServiceRatingSum / serviceRatingCount : 0
  const averageValueRating = valueRatingCount > 0 ? totalValueRatingSum / valueRatingCount : 0

  const mostVisitedPlaces = Object.entries(placeVisits)
    .map(([name, placeData]) => ({
      name,
      count: placeData.count,
      avgRating: placeData.ratingCount > 0 ? placeData.totalRating / placeData.ratingCount : 0,
    }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 10)

  const recentEntries = takeRecentEntries(data, 5)

  return {
    totalVisits: data.length,
    uniquePlaces: uniquePlaces.size,
    wouldReturnCount,
    totalSpent,
    averagePrice,
    spentByMonth,
    spentByCuisine,
    spentByItemCategory,
    averageRating,
    averageFoodRating,
    averageAmbianceRating,
    averageServiceRating,
    averageValueRating,
    ratingDistribution,
    countByMonth,
    countByCuisine,
    countByCity,
    countByNeighborhood,
    countByCategory,
    countByPriceLevel,
    countByTag,
    countByItemCategory,
    countByDiningType,
    topCuisine: getTopEntry(countByCuisine),
    topCity: getTopEntry(countByCity),
    topNeighborhood: getTopEntry(countByNeighborhood),
    topCategory: getTopEntry(countByCategory),
    topItemCategory: getTopEntry(countByItemCategory),
    topDiningType: getTopEntry(countByDiningType),
    mostVisitedPlaces,
    recentEntries,
  }
}
