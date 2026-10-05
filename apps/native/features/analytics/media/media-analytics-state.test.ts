import assert from "node:assert/strict"
import { describe, it } from "node:test"

import type { MediaEntry } from "@analytics/domain"

import {
  createDefaultMediaAnalyticsFilters,
  deriveMediaAnalyticsState,
  resetMediaAnalyticsFilters,
  toggleMediaAnalyticsFilterValue,
} from "@/features/analytics/media/media-analytics-state"

function createMediaEntry(id: string, overrides: Partial<MediaEntry> = {}): MediaEntry {
  return {
    id,
    title: `Entry ${id}`,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    medium: "Movie",
    type: "Movie",
    status: "watched",
    ...overrides,
  } as MediaEntry
}

describe("native media analytics state", () => {
  it("applies analytics filters over all diary entries and reports summary counts", () => {
    const filters = {
      ...createDefaultMediaAnalyticsFilters(),
      genres: ["Drama"],
      statuses: ["watched"],
    }

    const state = deriveMediaAnalyticsState(
      [
        createMediaEntry("movie-1", {
          finish_date: "2026-01-05",
          genre: ["Drama"],
          language: ["English"],
          platform: "Mubi",
          status: "watched",
        }),
        createMediaEntry("movie-2", {
          finish_date: "2026-01-08",
          genre: ["Comedy"],
          language: ["Khmer"],
          platform: "Netflix",
          status: "planned",
        }),
      ],
      filters,
    )

    assert.equal(state.totalCount, 2)
    assert.equal(state.filteredCount, 1)
    assert.equal(state.hasActiveFilters, true)
    assert.equal(state.activeFilterCount, 2)
    assert.deepEqual(state.filteredEntries.map((entry) => entry.id), ["movie-1"])
    assert.deepEqual(state.filterOptions.languages, ["English", "Khmer"])
  })

  it("toggles grouped filters without mutating the input state", () => {
    const filters = {
      ...createDefaultMediaAnalyticsFilters(),
      genres: ["Drama"],
    }

    const next = toggleMediaAnalyticsFilterValue(filters, "genres", "Comedy")
    const removed = toggleMediaAnalyticsFilterValue(next, "genres", "Drama")

    assert.deepEqual(filters.genres, ["Drama"])
    assert.deepEqual(next.genres, ["Drama", "Comedy"])
    assert.deepEqual(removed.genres, ["Comedy"])
  })

  it("restores a fresh default filter state when reset is requested", () => {
    const filters = resetMediaAnalyticsFilters()

    assert.deepEqual(filters, createDefaultMediaAnalyticsFilters())
    assert.notEqual(filters.genres, createDefaultMediaAnalyticsFilters().genres)
    assert.notEqual(filters.mediums, createDefaultMediaAnalyticsFilters().mediums)
  })
})
