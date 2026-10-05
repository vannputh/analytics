import assert from "node:assert/strict"
import { describe, it } from "node:test"

import type { MediaMetrics } from "@analytics/domain"

import {
  createMediaAnalyticsBreakdownSections,
  createMediaAnalyticsKpis,
  createMediaAnalyticsMonthlySections,
  createRankedBreakdownData,
} from "@/features/analytics/media/media-analytics-presentation"

function createMetrics(overrides: Partial<MediaMetrics> = {}): MediaMetrics {
  return {
    averagePrice: 10,
    averageRating: 4.2,
    countByGenre: { Drama: 3, Comedy: 2, Thriller: 1 },
    countByLanguage: { English: 4, Khmer: 1 },
    countByMedium: { Movie: 5 },
    countByMonth: [
      { month: "2026-01", count: 2 },
      { month: "2026-02", count: 5 },
    ],
    countByPlatform: { Mubi: 2, Netflix: 3 },
    countByStatus: { Finished: 4, Watching: 1 },
    countByType: { Movie: 5 },
    daysWatched: 0.42,
    minutesByMedium: { Movie: 600 },
    minutesByMonth: [
      { month: "2026-01", minutes: 120 },
      { month: "2026-02", minutes: 300 },
    ],
    ratingDistribution: [],
    spentByMedium: { Movie: 50 },
    spentByMonth: [
      { amount: 15, byMedium: { Movie: 15 }, month: "2026-01" },
      { amount: 35, byMedium: { Movie: 35 }, month: "2026-02" },
    ],
    topGenre: "Drama",
    topLanguage: "English",
    topMedium: "Movie",
    topPlatform: "Netflix",
    totalHours: 7,
    totalItems: 5,
    totalMinutes: 420,
    totalSpent: 50,
    ...overrides,
  }
}

describe("native media analytics presentation", () => {
  it("maps shared metrics into the expected KPI cards", () => {
    const kpis = createMediaAnalyticsKpis(createMetrics())

    assert.equal(kpis.length, 10)
    assert.equal(kpis[0]?.label, "Total Spent")
    assert.equal(kpis[0]?.value, "$50")
    assert.equal(kpis[1]?.label, "Hours Watched")
    assert.equal(kpis[4]?.value, "4.2")
    assert.equal(kpis[5]?.value, "Drama")
    assert.equal(kpis[9]?.value, "2")
  })

  it("shapes monthly sections into ordered bar-strip data with relative fractions", () => {
    const sections = createMediaAnalyticsMonthlySections(createMetrics())
    const watchTime = sections.find((section) => section.key === "watch-time")

    assert.equal(sections.length, 3)
    assert.equal(watchTime?.items.length, 2)
    assert.equal(watchTime?.items[0]?.label, "Jan")
    assert.equal(watchTime?.items[0]?.valueLabel, "2h")
    assert.equal(watchTime?.items[1]?.valueLabel, "5h")
    assert.equal(watchTime?.items[1]?.fraction, 1)
  })

  it("truncates ranked breakdowns and keeps empty sections empty", () => {
    const ranked = createRankedBreakdownData({
      Alpha: 9,
      Beta: 8,
      Delta: 6,
      Epsilon: 5,
      Eta: 3,
      Gamma: 7,
      Zeta: 4,
    })
    const breakdownSections = createMediaAnalyticsBreakdownSections(
      createMetrics({
        countByGenre: {},
        countByLanguage: {},
      }),
    )

    assert.equal(ranked.length, 6)
    assert.equal(ranked[0]?.label, "Alpha")
    assert.equal(ranked[0]?.fraction, 1)
    assert.equal(ranked[5]?.label, "Zeta")
    assert.deepEqual(breakdownSections[0]?.items, [])
    assert.deepEqual(breakdownSections[1]?.items, [])
  })
})
