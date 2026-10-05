import assert from "node:assert/strict"
import { describe, it } from "node:test"

import type { FoodEntry } from "@analytics/domain"

import {
  createDefaultFoodAnalyticsFilters,
  deriveFoodAnalyticsState,
  resetFoodAnalyticsFilters,
  toggleFoodAnalyticsFilterValue,
} from "@/features/analytics/food/food-analytics-state"

function createFoodEntry(id: string, overrides: Partial<FoodEntry> = {}): FoodEntry {
  return {
    id,
    user_id: "user-1",
    name: `Place ${id}`,
    branch: null,
    visit_date: "2026-03-01",
    category: "Restaurant",
    address: null,
    google_maps_url: null,
    latitude: null,
    longitude: null,
    neighborhood: null,
    city: "Phnom Penh",
    country: "Cambodia",
    instagram_handle: null,
    website_url: null,
    items_ordered: null,
    favorite_item: null,
    overall_rating: 4,
    food_rating: null,
    ambiance_rating: null,
    service_rating: null,
    value_rating: null,
    total_price: 12,
    currency: "USD",
    price_level: "$$",
    cuisine_type: ["Khmer"],
    dining_type: "eat_in",
    tags: null,
    would_return: true,
    notes: null,
    created_at: "2026-03-01T00:00:00.000Z",
    updated_at: "2026-03-01T00:00:00.000Z",
    ...overrides,
  }
}

describe("native food analytics state", () => {
  it("filters visits by cuisine and reports option lists from the full diary", () => {
    const filters = {
      ...createDefaultFoodAnalyticsFilters(),
      cuisineTypes: ["Thai"],
    }

    const state = deriveFoodAnalyticsState(
      [
        createFoodEntry("one", { cuisine_type: ["Khmer"], city: "Phnom Penh" }),
        createFoodEntry("two", {
          category: "Cafe",
          city: "Siem Reap",
          cuisine_type: ["Thai"],
          visit_date: "2026-03-08",
        }),
      ],
      filters,
    )

    assert.equal(state.totalCount, 2)
    assert.equal(state.filteredCount, 1)
    assert.equal(state.hasActiveFilters, true)
    assert.deepEqual(state.filteredEntries.map((entry) => entry.id), ["two"])
    assert.deepEqual(state.filterOptions.cities, ["Phnom Penh", "Siem Reap"])
    assert.deepEqual(state.filterOptions.categories, ["Cafe", "Restaurant"])
  })

  it("toggles grouped filters without mutating the original state", () => {
    const filters = {
      ...createDefaultFoodAnalyticsFilters(),
      cities: ["Phnom Penh"],
    }

    const next = toggleFoodAnalyticsFilterValue(filters, "cities", "Siem Reap")
    const removed = toggleFoodAnalyticsFilterValue(next, "cities", "Phnom Penh")

    assert.deepEqual(filters.cities, ["Phnom Penh"])
    assert.deepEqual(next.cities, ["Phnom Penh", "Siem Reap"])
    assert.deepEqual(removed.cities, ["Siem Reap"])
  })

  it("restores a fresh default filter state when reset is requested", () => {
    const filters = resetFoodAnalyticsFilters()

    assert.deepEqual(filters, createDefaultFoodAnalyticsFilters())
    assert.notEqual(filters.categories, createDefaultFoodAnalyticsFilters().categories)
  })
})
