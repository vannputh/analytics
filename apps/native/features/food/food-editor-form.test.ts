import assert from "node:assert/strict"
import { describe, it } from "node:test"

import type { FoodEntry } from "@analytics/domain"

import {
  applyPlaceDetailsPatch,
  applyPlaceSuggestion,
  buildFoodPayload,
  createEmptyFormState,
  createFormStateFromSource,
  isValidDateKey,
  toggleValue,
} from "@/features/food/food-editor-form"

function createFoodEntry(overrides: Partial<FoodEntry> = {}): FoodEntry {
  return {
    id: "entry-1",
    user_id: "user-1",
    name: "Rice House",
    branch: "BKK1",
    visit_date: "2026-03-01",
    category: "Restaurant",
    address: "Street 240",
    google_maps_url: "https://maps.google.com/?q=rice",
    latitude: 11.55,
    longitude: 104.92,
    neighborhood: "BKK1",
    city: "Phnom Penh",
    country: "Cambodia",
    instagram_handle: "@ricehouse",
    website_url: "https://rice.example",
    items_ordered: [
      {
        name: "Amok",
        price: 12,
        image_url: "https://example.com/amok.jpg",
        category: "Main",
        categories: ["Curry"],
      },
    ],
    favorite_item: "Amok",
    overall_rating: 5,
    food_rating: 5,
    ambiance_rating: 4,
    service_rating: 4,
    value_rating: 5,
    total_price: 24,
    currency: "USD",
    price_level: "$$",
    cuisine_type: ["Khmer"],
    dining_type: "eat_in",
    tags: ["Casual"],
    would_return: true,
    notes: "Excellent",
    created_at: "2026-03-01T00:00:00.000Z",
    updated_at: "2026-03-01T00:00:00.000Z",
    ...overrides,
  }
}

describe("food editor form helpers", () => {
  it("accepts valid local date keys and rejects malformed values", () => {
    assert.equal(isValidDateKey("2026-03-09"), true)
    assert.equal(isValidDateKey("03/09/2026"), false)
    assert.equal(isValidDateKey("2026-13-40"), false)
  })

  it("hydrates a form from an existing entry and rebuilds a save payload", () => {
    const form = createFormStateFromSource(createFoodEntry(), "2026-03-11")
    const payload = buildFoodPayload({
      ...form,
      instagramHandle: "@ricehouse",
      items: [
        ...form.items,
        { categoriesText: "", category: "", name: "   ", price: "4" },
      ],
    })

    assert.equal(form.name, "Rice House")
    assert.equal(form.items[0]?.categoriesText, "Curry")
    assert.equal(payload.instagram_handle, "ricehouse")
    assert.equal(payload.items_ordered?.length, 1)
    assert.equal(payload.visit_date, "2026-03-01")
    assert.deepEqual(payload.cuisine_type, ["Khmer"])
  })

  it("applies a local place suggestion without wiping the current visit date", () => {
    const current = createEmptyFormState("2026-03-11")
    const next = applyPlaceSuggestion(current, createFoodEntry())

    assert.equal(next.name, "Rice House")
    assert.equal(next.city, "Phnom Penh")
    assert.equal(next.visitDate, "2026-03-11")
    assert.deepEqual(toggleValue(["Khmer"], "Thai"), ["Khmer", "Thai"])
    assert.deepEqual(toggleValue(["Khmer", "Thai"], "Khmer"), ["Thai"])
  })

  it("maps Google place details onto form chips without wiping the visit date", () => {
    const current = createEmptyFormState("2026-03-11")
    const next = applyPlaceDetailsPatch(current, {
      name: "Noodle Bar",
      address: "Street 308",
      websiteUrl: "https://noodle.example",
      neighborhood: "BKK1",
      city: "Phnom Penh",
      country: "Cambodia",
      priceLevel: "$$",
      googleMapsUrl: "https://maps.google.com/?cid=1",
      latitude: 11.55,
      longitude: 104.92,
      category: "Café",
      cuisineTypes: ["Khmer", "Thai"],
      photos: ["places/abc/photos/one"],
    })

    assert.equal(next.name, "Noodle Bar")
    assert.equal(next.priceLevel, "$$")
    assert.equal(next.category, "Café")
    assert.equal(next.visitDate, "2026-03-11")
    assert.deepEqual(next.cuisineTypes, ["Khmer", "Thai"])
  })
})
