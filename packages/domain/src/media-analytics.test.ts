import assert from "node:assert/strict"
import { describe, it } from "node:test"

import type { MediaEntry } from "./database.types"
import { calculateMediaMetrics } from "./media-analytics"

function createMediaEntry(id: string, overrides: Partial<MediaEntry> = {}): MediaEntry {
  return {
    id,
    title: `Entry ${id}`,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    status: "watched",
    medium: "Movie",
    type: "Movie",
    ...overrides,
  } as MediaEntry
}

describe("calculateMediaMetrics", () => {
  it("aggregates media analytics fields", () => {
    const metrics = calculateMediaMetrics([
      createMediaEntry("movie-1", {
        finish_date: "2026-01-02",
        genre: ["Sci-Fi", "Drama"],
        language: [" english "],
        length: "120 min",
        medium: "Movie",
        my_rating: 4.5,
        platform: "Mubi",
        price: 12,
      }),
      createMediaEntry("show-1", {
        finish_date: "2026-01-15",
        genre: ["Drama"],
        language: ["Khmer"],
        length: "45 min",
        medium: "TV Show",
        platform: "Netflix",
        price: 8,
        rating: 3.5,
        type: "Scripted Live Action",
      }),
      createMediaEntry("book-1", {
        finish_date: "2026-02-01",
        genre: ["Memoir"],
        language: ["English"],
        medium: "Book",
        platform: "Kindle",
        price: 5,
        rating: 5,
        type: "Book",
      }),
    ])

    assert.equal(metrics.totalSpent, 25)
    assert.equal(metrics.totalMinutes, 165)
    assert.equal(metrics.totalHours, 2.75)
    assert.equal(metrics.totalItems, 3)
    assert.deepEqual(metrics.countByMedium, { Book: 1, Movie: 1, "TV Show": 1 })
    assert.deepEqual(metrics.countByLanguage, { English: 2, Khmer: 1 })
    assert.equal(metrics.topGenre, "Drama")
    assert.equal(metrics.averageRating, (4.5 + 3.5 + 5) / 3)
    assert.deepEqual(metrics.ratingDistribution, [
      { rating: 3, count: 1 },
      { rating: 4, count: 1 },
      { rating: 5, count: 1 },
    ])
  })
})
