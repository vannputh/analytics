import assert from "node:assert/strict"
import { describe, it } from "node:test"

import type { FilterState, MediaEntry } from "./index"
import { defaultFilterState } from "./filter-types"
import {
  getMediaSearchSourceEntries,
  normalizeMediaSearchQuery,
  searchMediaEntries,
} from "./media-entry-search"

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

describe("media entry search helpers", () => {
  it("searches across watching, watched, planned, and hold or dropped entries", () => {
    const entries = [
      createMediaEntry("watching", {
        status: "watching",
        title: "Moon Mission",
        last_watched_at: "2026-01-12T00:00:00.000Z",
      }),
      createMediaEntry("watched", {
        status: "watched",
        title: "After Moon",
        finish_date: "2026-01-10",
      }),
      createMediaEntry("planned", {
        status: "planned",
        title: "Queue",
        genre: ["Moonshot"],
        updated_at: "2026-01-09T00:00:00.000Z",
      }),
      createMediaEntry("dropped", {
        status: "dropped",
        title: "Orbit",
        platform: "Moonbox",
        updated_at: "2026-01-08T00:00:00.000Z",
      }),
    ]

    const results = searchMediaEntries(entries, {
      query: "moon",
      scope: "all",
    })

    assert.deepEqual(results.map((result) => result.entry.id), ["watching", "watched", "planned", "dropped"])
  })

  it("applies filtered scope before matching and all scope ignores filters", () => {
    const entries = [
      createMediaEntry("finished", {
        status: "watched",
        title: "Moonrise",
        finish_date: "2026-01-10",
      }),
      createMediaEntry("planned", {
        status: "planned",
        title: "Moon Queue",
        updated_at: "2026-01-11T00:00:00.000Z",
      }),
    ]

    const filters: FilterState = {
      ...defaultFilterState,
      statuses: ["watched"],
    }

    const filteredResults = searchMediaEntries(entries, {
      filters,
      query: "moon",
      scope: "filtered",
    })
    const allResults = searchMediaEntries(entries, {
      filters,
      query: "moon",
      scope: "all",
    })

    assert.deepEqual(getMediaSearchSourceEntries(entries, filters, "filtered").map((entry) => entry.id), ["finished"])
    assert.deepEqual(filteredResults.map((result) => result.entry.id), ["finished"])
    assert.deepEqual(allResults.map((result) => result.entry.id), ["planned", "finished"])
  })

  it("ranks title prefix before substring, substring before secondary matches, then uses recency", () => {
    const entries = [
      createMediaEntry("prefix-new", {
        status: "watched",
        title: "Moon Alpha",
        finish_date: "2026-01-11",
      }),
      createMediaEntry("prefix-old", {
        status: "watched",
        title: "Moon Archive",
        finish_date: "2026-01-09",
      }),
      createMediaEntry("substring", {
        status: "watched",
        title: "After Moon",
        finish_date: "2026-01-12",
      }),
      createMediaEntry("secondary", {
        status: "watched",
        title: "Orbit",
        genre: ["Mooncore"],
        finish_date: "2026-01-13",
      }),
    ]

    const results = searchMediaEntries(entries, {
      query: "moon",
      scope: "all",
    })

    assert.deepEqual(
      results.map((result) => [result.entry.id, result.matchKind, result.matchedField]),
      [
        ["prefix-new", "title-prefix", "title"],
        ["prefix-old", "title-prefix", "title"],
        ["substring", "title-substring", "title"],
        ["secondary", "secondary-field", "genre"],
      ],
    )
  })

  it("normalizes blank queries and returns no results when nothing matches", () => {
    const entries = [
      createMediaEntry("entry-1", {
        status: "watched",
        title: "Orbit",
      }),
    ]

    assert.equal(normalizeMediaSearchQuery("  Moon  "), "moon")
    assert.deepEqual(searchMediaEntries(entries, { query: "   " }), [])
    assert.deepEqual(searchMediaEntries(entries, { query: "zebra", scope: "all" }), [])
  })
})
