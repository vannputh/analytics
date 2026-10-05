import assert from "node:assert/strict"
import { describe, it } from "node:test"

import type { FoodEntry } from "./database.types"
import {
  buildFoodCalendarMonth,
  createFoodDuplicateEntryDraft,
  formatFoodDateKey,
  groupFoodEntriesByDate,
  toggleFoodSelectedDate,
} from "./food-calendar"

function createFoodEntry(id: string, overrides: Partial<FoodEntry> = {}): FoodEntry {
  return {
    id,
    user_id: "user-1",
    name: `Place ${id}`,
    branch: null,
    visit_date: "2026-03-01",
    category: null,
    address: null,
    google_maps_url: null,
    latitude: null,
    longitude: null,
    neighborhood: null,
    city: null,
    country: "Cambodia",
    instagram_handle: null,
    website_url: null,
    items_ordered: null,
    favorite_item: null,
    overall_rating: null,
    food_rating: null,
    ambiance_rating: null,
    service_rating: null,
    value_rating: null,
    total_price: null,
    currency: "USD",
    price_level: null,
    cuisine_type: null,
    dining_type: null,
    tags: null,
    would_return: null,
    notes: null,
    created_at: "2026-03-01T00:00:00.000Z",
    updated_at: "2026-03-01T00:00:00.000Z",
    ...overrides,
  }
}

describe("food-calendar helpers", () => {
  it("builds a Monday-start 6x7 month grid and marks today", () => {
    const days = buildFoodCalendarMonth(2026, 2, new Date("2026-03-11T00:00:00.000Z"))

    assert.equal(days.length, 42)
    assert.equal(days[0]?.date, "2026-02-23")
    assert.equal(days[0]?.isCurrentMonth, false)
    assert.equal(days[15]?.date, "2026-03-10")
    assert.equal(days[16]?.date, "2026-03-11")
    assert.equal(days[16]?.isToday, true)
  })

  it("groups entries by visit date", () => {
    const grouped = groupFoodEntriesByDate([
      createFoodEntry("2", {
        visit_date: "2026-03-11",
        created_at: "2026-03-11T01:00:00.000Z",
      }),
      createFoodEntry("1", {
        visit_date: "2026-03-11",
        created_at: "2026-03-11T00:00:00.000Z",
      }),
      createFoodEntry("3", {
        visit_date: "2026-03-09",
        created_at: "2026-03-09T00:00:00.000Z",
      }),
    ])

    assert.deepEqual(Object.keys(grouped).sort(), ["2026-03-09", "2026-03-11"])
    assert.deepEqual(grouped["2026-03-11"]?.map((entry) => entry.id), ["2", "1"])
  })

  it("creates a duplicate draft with a new visit date", () => {
    const draft = createFoodDuplicateEntryDraft(
      createFoodEntry("1", {
        name: "Rice House",
        branch: "BKK1",
        visit_date: "2026-03-01",
        items_ordered: [
          {
            name: "Amok",
            price: 12,
            image_url: "https://example.com/amok.jpg",
            category: "Main",
            categories: ["Curry"],
          },
        ],
      }),
      "2026-03-11",
    )

    assert.equal(draft.name, "Rice House")
    assert.equal(draft.branch, "BKK1")
    assert.equal(draft.visit_date, "2026-03-11")
    assert.equal(draft.items_ordered?.[0]?.image_url, null)
    assert.deepEqual(draft.items_ordered?.[0]?.categories, ["Curry"])
  })

  it("toggles the selected day when the same date is pressed twice", () => {
    assert.equal(toggleFoodSelectedDate(null, "2026-03-11"), "2026-03-11")
    assert.equal(toggleFoodSelectedDate("2026-03-11", "2026-03-11"), null)
    assert.equal(toggleFoodSelectedDate("2026-03-10", "2026-03-11"), "2026-03-11")
  })

  it("formats local calendar date keys without UTC shifting", () => {
    assert.equal(formatFoodDateKey(new Date(2026, 2, 9)), "2026-03-09")
  })
})
