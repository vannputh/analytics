import { describe, expect, it } from "vitest"
import { applyFilters, defaultFilterState, type FilterState } from "./filter-types"
import type { MediaEntry } from "./database.types"

// applyFilters only reads a handful of fields; a partial cast keeps tests focused.
const makeEntry = (partial: Partial<MediaEntry>): MediaEntry => partial as MediaEntry
const withFilters = (partial: Partial<FilterState>): FilterState => ({
  ...defaultFilterState,
  ...partial,
})

describe("applyFilters", () => {
  it("returns everything when no filters are set (empty filter must not narrow)", () => {
    const data = [makeEntry({ id: "1" }), makeEntry({ id: "2" })]
    expect(applyFilters(data, defaultFilterState)).toHaveLength(2)
  })

  it("narrows by medium", () => {
    const data = [
      makeEntry({ id: "1", medium: "Movie" }),
      makeEntry({ id: "2", medium: "TV Show" }),
    ]
    const result = applyFilters(data, withFilters({ mediums: ["Movie"] }))
    expect(result.map((e) => e.id)).toEqual(["1"])
  })

  // Language filtering is intentionally AND: selecting English + Japanese keeps only
  // entries tagged with BOTH (e.g. dual-audio), not the union.
  it("applies AND logic across selected languages", () => {
    const data = [
      makeEntry({ id: "both", language: ["English", "Japanese"] }),
      makeEntry({ id: "one", language: ["English"] }),
    ]
    const result = applyFilters(data, withFilters({ languages: ["English", "Japanese"] }))
    expect(result.map((e) => e.id)).toEqual(["both"])
  })

  // Genre filtering is also AND and case-insensitive.
  it("applies case-insensitive AND logic across selected genres", () => {
    const data = [
      makeEntry({ id: "match", genre: ["Action", "Comedy"] }),
      makeEntry({ id: "partial", genre: ["Action"] }),
    ]
    const result = applyFilters(data, withFilters({ genres: ["action", "comedy"] }))
    expect(result.map((e) => e.id)).toEqual(["match"])
  })

  // The diary date range filters on finish_date, falling back to start_date when an
  // entry hasn't been finished yet.
  it("filters by date range using finish_date with start_date fallback", () => {
    const data = [
      makeEntry({ id: "in", finish_date: "2026-03-15" }),
      makeEntry({ id: "out", finish_date: "2025-01-01" }),
      makeEntry({ id: "fallback", finish_date: null, start_date: "2026-06-01" }),
    ]
    const result = applyFilters(data, withFilters({ dateFrom: "2026-01-01", dateTo: "2026-12-31" }))
    expect(result.map((e) => e.id).sort()).toEqual(["fallback", "in"])
  })
})
