import type { FilterState } from "@analytics/domain"

export function countActiveMediaFilters(filters: FilterState) {
  let count = 0

  if (filters.dateFrom) count += 1
  if (filters.dateTo) count += 1
  count += filters.genres.length
  count += filters.mediums.length
  count += filters.languages.length
  count += filters.platforms.length
  count += filters.statuses.length
  count += filters.types.length

  return count
}
