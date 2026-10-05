import assert from "node:assert/strict"
import { describe, it } from "node:test"

import type { MediaEntry } from "@analytics/domain"
import { defaultFilterState } from "@analytics/domain"

import { deriveMediaSearchState } from "@/features/media/media-search-state"

function createMediaEntry(id: string, overrides: Partial<MediaEntry> = {}): MediaEntry {
  return {
    id,
    title: `Entry ${id}`,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    medium: "Movie",
    type: "Movie",
    status: null,
    ...overrides,
  } as MediaEntry
}

describe("native media search state", () => {
  it("defaults to filtered scope and derives results from current filter state", () => {
    const entries = [
      createMediaEntry("finished", {
        status: "watched",
        title: "Moonrise",
        genre: ["Drama"],
        finish_date: "2026-01-10",
      }),
      createMediaEntry("planned", {
        status: "planned",
        title: "Moon Queue",
        genre: ["Comedy"],
      }),
    ]

    const result = deriveMediaSearchState(
      entries,
      {
        ...defaultFilterState,
        genres: ["Drama"],
      },
      "moon",
    )

    assert.equal(result.normalizedQuery, "moon")
    assert.equal(result.searchedEntryCount, 1)
    assert.deepEqual(result.results.map((item) => item.entry.id), ["finished"])
  })

  it("can widen search to all entries without mutating the filtered search source", () => {
    const entries = [
      createMediaEntry("finished", {
        status: "watched",
        title: "Moonrise",
        genre: ["Drama"],
      }),
      createMediaEntry("planned", {
        status: "planned",
        title: "Moon Queue",
        genre: ["Comedy"],
      }),
    ]

    const filters = {
      ...defaultFilterState,
      genres: ["Drama"],
    }

    const filteredResult = deriveMediaSearchState(entries, filters, "moon", "filtered")
    const allResult = deriveMediaSearchState(entries, filters, "moon", "all")

    assert.equal(filteredResult.searchedEntryCount, 1)
    assert.equal(allResult.searchedEntryCount, 2)
    assert.deepEqual(allResult.results.map((item) => item.entry.id), ["planned", "finished"])
    assert.deepEqual(filters.genres, ["Drama"])
  })

  it("becomes inactive when the query is cleared", () => {
    const entries = [
      createMediaEntry("finished", {
        status: "watched",
        title: "Moonrise",
      }),
    ]

    const result = deriveMediaSearchState(entries, defaultFilterState, "   ")

    assert.equal(result.isActive, false)
    assert.equal(result.normalizedQuery, "")
    assert.deepEqual(result.results, [])
    assert.equal(result.searchedEntryCount, 1)
  })
})
