import type { FilterState, MediaEntry, MediaEntrySearchResult, MediaSearchScope } from "@analytics/domain"
import {
  getMediaSearchSourceEntries,
  normalizeMediaSearchQuery,
  searchMediaEntries,
} from "@analytics/domain"

export interface DerivedMediaSearchState {
  isActive: boolean
  normalizedQuery: string
  results: MediaEntrySearchResult[]
  searchedEntryCount: number
}

export function deriveMediaSearchState(
  allEntries: MediaEntry[],
  filters: FilterState,
  query: string,
  scope: MediaSearchScope = "filtered",
): DerivedMediaSearchState {
  const normalizedQuery = normalizeMediaSearchQuery(query)
  const searchedEntries = getMediaSearchSourceEntries(allEntries, filters, scope)

  return {
    isActive: normalizedQuery.length > 0,
    normalizedQuery,
    results: normalizedQuery
      ? searchMediaEntries(allEntries, {
          filters,
          query: normalizedQuery,
          scope,
        })
      : [],
    searchedEntryCount: searchedEntries.length,
  }
}
