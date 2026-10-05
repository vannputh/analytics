import type { MediaEntrySearchResult } from "@analytics/domain"

import {
  createMediaSearchListItemFromEntryResult,
} from "@/features/media/media-search-list-item"
import type { MediaSearchListItem, MetadataSearchResult } from "@/features/media/media-types"

export interface MediaSearchFallbackState {
  error: string | null
  loading: boolean
  results: MetadataSearchResult[]
}

export interface MediaSearchPresentationState {
  emptyDetail: string | null
  emptyTitle: string
  items: MediaSearchListItem[]
  shouldFetchFallback: boolean
  summary: string
}

export function shouldFetchMediaSearchFallback(_normalizedQuery: string, _localResultCount: number) {
  return false
}

export function deriveMediaSearchPresentationState({
  localResults,
  normalizedQuery,
}: {
  fallback: MediaSearchFallbackState
  localResults: MediaEntrySearchResult[]
  normalizedQuery: string
}): MediaSearchPresentationState {
  if (!normalizedQuery) {
    return {
      emptyDetail: "Jump to any movie or show across your entire media diary.",
      emptyTitle: "Search your diary",
      items: [],
      shouldFetchFallback: false,
      summary: "Search every movie and show in your diary.",
    }
  }

  if (localResults.length > 0) {
    return {
      emptyDetail: null,
      emptyTitle: `No results for "${normalizedQuery}"`,
      items: localResults.map(createMediaSearchListItemFromEntryResult),
      shouldFetchFallback: false,
      summary: localResults.length === 1 ? "1 result" : `${localResults.length} results`,
    }
  }

  return {
    emptyDetail: "Try a different title.",
    emptyTitle: `No results for "${normalizedQuery}"`,
    items: [],
    shouldFetchFallback: false,
    summary: `No results for "${normalizedQuery}"`,
  }
}
