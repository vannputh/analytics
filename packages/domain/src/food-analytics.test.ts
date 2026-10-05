import assert from "node:assert/strict"
import { describe, it } from "node:test"

import type { FoodEntry } from "./database.types"
import {
  FOOD_ANALYTICS_ENTRY_SELECT,
  calculateFoodMetrics,
  filterFoodEntriesByDrillDown,
  filterFoodEntriesForAnalytics,
  groupFoodEntriesByPlace,
  mapFoodAnalyticsChartItemToDrillDown,
  type FoodAnalyticsDrillDown,
} from "./food-analytics"
import { defaultFoodFilterState } from "./food-types"

function createFoodEntry(id: string, overrides: Partial<FoodEntry> = {}): FoodEntry {
  return {
    id,
    user_id: "user-1",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    name: `Place ${id}`,
    visit_date: "2026-01-01",
    items_ordered: [],
    ...overrides,
  } as FoodEntry
}

describe("food analytics helpers", () => {
  const entries = [
    createFoodEntry("1", {
      name: "Rice House",
      visit_date: "2026-01-03",
      category: "Restaurant",
      city: "Phnom Penh",
      cuisine_type: ["Cambodian"],
      dining_type: "eat_in",
      overall_rating: 5,
      price_level: "$$",
      total_price: 20,
      would_return: true,
      items_ordered: [
        { name: "Amok", price: 12, image_url: null, category: null, categories: ["Curry"] },
        { name: "Iced Tea", price: 4, image_url: null, category: "Drink" },
      ],
    }),
    createFoodEntry("2", {
      name: "Rice House",
      visit_date: "2026-01-10",
      category: "Restaurant",
      city: "Phnom Penh",
      cuisine_type: ["Cambodian"],
      dining_type: "eat_in",
      neighborhood: "BKK1",
      overall_rating: 4,
      price_level: "$$",
      total_price: 18,
      would_return: true,
      items_ordered: [{ name: "Noodles", price: 10, image_url: null, category: "Noodles" }],
    }),
    createFoodEntry("3", {
      name: "Cafe Blue",
      visit_date: "2026-02-01",
      category: "Café",
      city: "Siem Reap",
      cuisine_type: ["French"],
      dining_type: "takeaway",
      overall_rating: 3,
      price_level: "$",
      total_price: 8,
      would_return: false,
      items_ordered: [{ name: "Croissant", price: 3, image_url: null, category: null, categories: ["Bakery"] }],
      tags: ["Casual"],
    }),
  ]

  it("calculates aggregate food metrics", () => {
    const metrics = calculateFoodMetrics(entries)

    assert.equal(metrics.totalVisits, 3)
    assert.equal(metrics.uniquePlaces, 2)
    assert.equal(metrics.totalSpent, 46)
    assert.equal(metrics.wouldReturnCount, 2)
    assert.equal(metrics.topCuisine, "Cambodian")
    assert.equal(metrics.topCity, "Phnom Penh")
    assert.deepEqual(metrics.countByMonth, [
      { month: "2026-01", count: 2 },
      { month: "2026-02", count: 1 },
    ])
    assert.equal(metrics.mostVisitedPlaces[0]?.name, "Rice House")
    assert.equal(metrics.recentEntries[0]?.name, "Cafe Blue")
    assert.equal(FOOD_ANALYTICS_ENTRY_SELECT.includes("items_ordered"), true)
    assert.equal(FOOD_ANALYTICS_ENTRY_SELECT.includes("notes"), false)
    assert.equal(FOOD_ANALYTICS_ENTRY_SELECT.includes("google_maps_url"), false)
  })

  it("keeps only the newest visits while scanning each entry once", () => {
    const many = Array.from({ length: 20 }, (_, index) =>
      createFoodEntry(String(index), {
        name: `Place ${index}`,
        visit_date: `2026-01-${String(index + 1).padStart(2, "0")}`,
      }),
    )

    const metrics = calculateFoodMetrics(many)

    assert.deepEqual(
      metrics.recentEntries.map((entry) => entry.id),
      ["19", "18", "17", "16", "15"],
    )
  })

  it("filters entries for analytics and drill-down views", () => {
    const filtered = filterFoodEntriesForAnalytics(entries, {
      ...defaultFoodFilterState,
      cities: ["Phnom Penh"],
      minRating: 4,
    })

    assert.deepEqual(filtered.map((entry) => entry.id), ["1", "2"])

    const drillDown: FoodAnalyticsDrillDown = {
      dimension: "itemCategory",
      label: "Curry",
      value: "Curry",
    }
    const drilled = filterFoodEntriesByDrillDown(entries, drillDown)

    assert.deepEqual(drilled.map((entry) => entry.id), ["1"])
  })

  it("groups visits by place and sorts them descending", () => {
    const groups = groupFoodEntriesByPlace(entries)

    assert.deepEqual(groups.map((group) => group.placeName), ["Cafe Blue", "Rice House"])
    assert.deepEqual(
      groups.find((group) => group.placeName === "Rice House")?.entries.map((entry) => entry.id),
      ["2", "1"],
    )
  })

  it("maps analytics chart section keys onto stored drill-down dimensions", () => {
    assert.deepEqual(
      mapFoodAnalyticsChartItemToDrillDown("visits", { key: "2026-01", label: "Jan" }),
      { dimension: "month", label: "Jan", value: "2026-01" },
    )
    assert.deepEqual(
      mapFoodAnalyticsChartItemToDrillDown("spending", { key: "2026-02", label: "Feb" }),
      { dimension: "month", label: "Feb", value: "2026-02" },
    )
    assert.deepEqual(
      mapFoodAnalyticsChartItemToDrillDown("cuisines", { key: "Khmer", label: "Khmer" }),
      { dimension: "cuisine", label: "Khmer", value: "Khmer" },
    )
    assert.deepEqual(
      mapFoodAnalyticsChartItemToDrillDown("cities", { key: "Phnom Penh", label: "Phnom Penh" }),
      { dimension: "city", label: "Phnom Penh", value: "Phnom Penh" },
    )
    assert.deepEqual(
      mapFoodAnalyticsChartItemToDrillDown("categories", { key: "Restaurant", label: "Restaurant" }),
      { dimension: "category", label: "Restaurant", value: "Restaurant" },
    )
    assert.deepEqual(
      mapFoodAnalyticsChartItemToDrillDown("dining", { key: "eat_in", label: "Dine in" }),
      { dimension: "diningType", label: "Dine in", value: "eat_in" },
    )
    assert.equal(mapFoodAnalyticsChartItemToDrillDown("unknown", { key: "x", label: "x" }), null)
  })
})
