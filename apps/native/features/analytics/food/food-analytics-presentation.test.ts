import assert from "node:assert/strict"
import { describe, it } from "node:test"

import type { FoodMetrics } from "@analytics/domain"
import { mapFoodAnalyticsChartItemToDrillDown } from "@analytics/domain"

import {
  createFoodAnalyticsBreakdownSections,
  createFoodAnalyticsKpis,
  createFoodAnalyticsMonthlySections,
} from "@/features/analytics/food/food-analytics-presentation"

function createMetrics(overrides: Partial<FoodMetrics> = {}): FoodMetrics {
  return {
    averageAmbianceRating: 4,
    averageFoodRating: 4.5,
    averagePrice: 20,
    averageRating: 4.6,
    averageServiceRating: 4.2,
    averageValueRating: 4.1,
    countByCategory: { Restaurant: 4, Cafe: 2 },
    countByCity: { "Phnom Penh": 5, "Siem Reap": 1 },
    countByCuisine: { Khmer: 4, Thai: 2 },
    countByDiningType: { eat_in: 5, takeaway: 1 },
    countByItemCategory: { Main: 3 },
    countByMonth: [
      { month: "2026-01", count: 2 },
      { month: "2026-02", count: 4 },
    ],
    countByNeighborhood: { BKK1: 3 },
    countByPriceLevel: { $$: 4 },
    countByTag: { Casual: 3 },
    mostVisitedPlaces: [],
    ratingDistribution: [],
    recentEntries: [],
    spentByCuisine: { Khmer: 80 },
    spentByItemCategory: { Main: 60 },
    spentByMonth: [
      { month: "2026-01", amount: 30 },
      { month: "2026-02", amount: 90 },
    ],
    topCategory: "Restaurant",
    topCity: "Phnom Penh",
    topCuisine: "Khmer",
    topDiningType: "eat_in",
    topItemCategory: "Main",
    topNeighborhood: "BKK1",
    totalSpent: 120,
    totalVisits: 6,
    uniquePlaces: 4,
    wouldReturnCount: 3,
    ...overrides,
  }
}

describe("native food analytics presentation", () => {
  it("maps shared food metrics into the expected KPI cards", () => {
    const kpis = createFoodAnalyticsKpis(createMetrics())

    assert.equal(kpis.length, 6)
    assert.equal(kpis[0]?.label, "Total Visits")
    assert.equal(kpis[0]?.value, "6")
    assert.equal(kpis[1]?.label, "Total Spent")
    assert.equal(kpis[1]?.value, "$120")
    assert.equal(kpis[2]?.value, "4.6")
    assert.equal(kpis[3]?.value, "Phnom Penh")
    assert.equal(kpis[4]?.value, "Restaurant")
    assert.equal(kpis[5]?.value, "50%")
  })

  it("shapes monthly visit and spending bars with relative fractions", () => {
    const sections = createFoodAnalyticsMonthlySections(createMetrics())
    const visits = sections.find((section) => section.key === "visits")
    const spending = sections.find((section) => section.key === "spending")

    assert.equal(sections.length, 2)
    assert.equal(visits?.items[1]?.valueLabel, "4")
    assert.equal(visits?.items[1]?.fraction, 1)
    assert.equal(spending?.items[1]?.valueLabel, "$90")
    assert.equal(spending?.items[1]?.fraction, 1)
  })

  it("uses human dining labels in ranked breakdowns", () => {
    const sections = createFoodAnalyticsBreakdownSections(createMetrics())
    const dining = sections.find((section) => section.key === "dining")

    assert.equal(dining?.items[0]?.label, "Dine in")
    assert.equal(dining?.items[0]?.key, "eat_in")
    assert.equal(dining?.items[0]?.value, 5)
    assert.deepEqual(
      mapFoodAnalyticsChartItemToDrillDown("dining", dining!.items[0]!),
      { dimension: "diningType", label: "Dine in", value: "eat_in" },
    )
  })
})
