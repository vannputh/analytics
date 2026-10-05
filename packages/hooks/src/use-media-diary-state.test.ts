import assert from "node:assert/strict"
import { describe, it } from "node:test"

import type { FilterState, MediaEntry } from "@analytics/domain"
import { defaultFilterState } from "@analytics/domain"

import { deriveMediaDiaryState } from "./media-diary-state"

function createMediaEntry(
  id: string,
  overrides: Partial<MediaEntry> = {},
): MediaEntry {
  return {
    id,
    title: `Entry ${id}`,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    status: null,
    medium: "Movie",
    type: "Movie",
    ...overrides,
  } as MediaEntry
}

describe("deriveMediaDiaryState", () => {
  it("uses all entries for filter options while filtering watched entries", () => {
    const entries = [
      createMediaEntry("watching-1", {
        status: "watching",
        title: "Orbit",
        platform: "Netflix",
        genre: ["Sci-Fi"],
        language: ["English"],
      }),
      createMediaEntry("planned-1", {
        status: "planned",
        title: "Queued Horror",
        platform: "Hulu",
        genre: ["Horror"],
        language: ["Japanese"],
      }),
      createMediaEntry("finished-1", {
        status: "watched",
        title: "Moonrise",
        platform: "Disney+",
        genre: ["Drama"],
        language: ["English"],
        finish_date: "2026-01-10",
      }),
      createMediaEntry("finished-2", {
        status: "watched",
        title: "Sunset Laughs",
        platform: "Max",
        genre: ["Comedy"],
        language: ["French"],
        finish_date: "2026-01-11",
      }),
    ]

    const filters: FilterState = {
      ...defaultFilterState,
      genres: ["Drama"],
      languages: ["English"],
    }

    const result = deriveMediaDiaryState(entries, filters)

    assert.equal(result.watchedEntries.length, 1)
    assert.deepEqual(result.watchedEntries.map((entry) => entry.id), ["finished-1"])
    assert.deepEqual(result.diaryEntries.planned.map((entry) => entry.id), ["planned-1"])
    assert.deepEqual(result.filterOptions.platforms, ["Disney+", "Hulu", "Max", "Netflix"])
    assert.deepEqual(result.filterOptions.genres, ["Comedy", "Drama", "Horror", "Sci-Fi"])
    assert.deepEqual(result.filterOptions.languages, ["English", "French", "Japanese"])
  })

  it("applies filters only to watched entries and leaves planned entries in diary sections", () => {
    const entries = [
      createMediaEntry("finished-drama", {
        status: "watched",
        title: "Moonrise",
        platform: "Disney+",
        genre: ["Drama"],
        language: ["English"],
        finish_date: "2026-01-10",
      }),
      createMediaEntry("finished-comedy", {
        status: "watched",
        title: "Moonbeam",
        platform: "Max",
        genre: ["Comedy"],
        language: ["English"],
        finish_date: "2026-01-09",
      }),
      createMediaEntry("planned-match", {
        status: "planned",
        title: "Moon Queue",
        platform: "Hulu",
        genre: ["Drama"],
        language: ["English"],
      }),
    ]

    const filters: FilterState = {
      ...defaultFilterState,
      genres: ["Drama"],
    }

    const result = deriveMediaDiaryState(entries, filters)

    assert.deepEqual(result.watchedEntries.map((entry) => entry.id), ["finished-drama"])
    assert.deepEqual(result.diaryEntries.planned.map((entry) => entry.id), ["planned-match"])
  })

  it("returns all watched entries when filters are blank", () => {
    const entries = [
      createMediaEntry("finished-1", {
        status: "watched",
        title: "Moonrise",
        finish_date: "2026-01-10",
      }),
      createMediaEntry("finished-2", {
        status: "watched",
        title: "Sunset Laughs",
        finish_date: "2026-01-11",
      }),
    ]

    const result = deriveMediaDiaryState(entries, defaultFilterState)

    assert.deepEqual(result.watchedEntries.map((entry) => entry.id), ["finished-2", "finished-1"])
  })
})
