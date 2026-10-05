import assert from "node:assert/strict"
import { describe, it } from "node:test"

import type { MediaEntry, MediaEntrySearchResult } from "@analytics/domain"

import {
  deriveMediaSearchPresentationState,
  shouldFetchMediaSearchFallback,
  type MediaSearchFallbackState,
} from "@/features/media/media-search-presentation"

function createMediaEntry(id: string, overrides: Partial<MediaEntry> = {}): MediaEntry {
  return {
    id,
    title: `Entry ${id}`,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    medium: "Movie",
    type: "Movie",
    status: "watching",
    ...overrides,
  } as MediaEntry
}

function createFallbackState(
  overrides: Partial<MediaSearchFallbackState> = {},
): MediaSearchFallbackState {
  return {
    error: null,
    loading: false,
    results: [],
    ...overrides,
  }
}

function createLocalResult(result: Partial<MediaEntrySearchResult> = {}): MediaEntrySearchResult {
  return {
    entry: createMediaEntry("1", { title: "Alien", platform: "Blu-ray" }),
    matchKind: "title-prefix",
    matchedField: "title",
    ...result,
  }
}

describe("native media search presentation", () => {
  it("keeps local diary results as the primary presentation", () => {
    const state = deriveMediaSearchPresentationState({
      fallback: createFallbackState(),
      localResults: [createLocalResult()],
      normalizedQuery: "alien",
    })

    assert.equal(state.shouldFetchFallback, false)
    assert.equal(state.summary, "1 result")
    assert.equal(state.items[0]?.kind, "local")
    assert.equal(state.items[0]?.primaryLabel, "watching")
  })

  it("never requests API fallback regardless of query length or local result count", () => {
    assert.equal(shouldFetchMediaSearchFallback("a", 0), false)
    assert.equal(shouldFetchMediaSearchFallback("al", 0), false)
    assert.equal(shouldFetchMediaSearchFallback("alien", 0), false)
  })

  it("shows a db-only empty state when no local matches found", () => {
    const state = deriveMediaSearchPresentationState({
      fallback: createFallbackState(),
      localResults: [],
      normalizedQuery: "alien",
    })

    assert.equal(state.shouldFetchFallback, false)
    assert.equal(state.emptyTitle, `No results for "alien"`)
    assert.deepEqual(state.items, [])
  })

  it("clears back to the default empty search state when the query is removed", () => {
    const state = deriveMediaSearchPresentationState({
      fallback: createFallbackState({
        loading: true,
        results: [
          {
            id: "omdb_tt0078748",
            imdb_id: "tt0078748",
            media_type: "movie",
            poster_url: null,
            source: "omdb",
            title: "Alien",
            year: "1979",
          },
        ],
      }),
      localResults: [],
      normalizedQuery: "",
    })

    assert.equal(state.shouldFetchFallback, false)
    assert.equal(state.summary, "Search every movie and show in your diary.")
    assert.deepEqual(state.items, [])
    assert.equal(state.emptyTitle, "Search your diary")
  })
})
