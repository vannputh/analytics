import assert from "node:assert/strict"
import { describe, it } from "node:test"

import type { FoodEntry } from "./database.types"
import type { FoodPlaceDetailsResponse, FoodPlaceSuggestion } from "./food-place-types"
import {
  extractGooglePlacePhotoNames,
  isGoogleMapsLookupUrl,
  isGooglePlacePhotoName,
  isKeyedGoogleMediaUrl,
  mapGooglePriceLevelToChip,
  mapPlaceDetailsToAutofillPatch,
  mergeFoodPlaceSuggestions,
} from "./food-place-autofill"

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

describe("food place autofill helpers", () => {
  it("maps Google numeric and enum price levels onto native $ chips", () => {
    assert.equal(mapGooglePriceLevelToChip("1"), "$")
    assert.equal(mapGooglePriceLevelToChip("2"), "$$")
    assert.equal(mapGooglePriceLevelToChip("3"), "$$$")
    assert.equal(mapGooglePriceLevelToChip("4"), "$$$$")
    assert.equal(mapGooglePriceLevelToChip("PRICE_LEVEL_EXPENSIVE"), "$$$")
    assert.equal(mapGooglePriceLevelToChip("$$"), "$$")
    assert.equal(mapGooglePriceLevelToChip("PRICE_LEVEL_UNSPECIFIED"), null)
    assert.equal(mapGooglePriceLevelToChip(""), null)
  })

  it("keeps local suggestions first and only appends Google results below the threshold", () => {
    const local = [
      createFoodEntry("1", { name: "Rice House", address: "Street 240", city: "Phnom Penh" }),
      createFoodEntry("2", { name: "Cafe Blue", address: "Pub Street", city: "Siem Reap" }),
    ]
    const google: FoodPlaceSuggestion[] = [
      {
        id: "google-1",
        source: "google",
        name: "Rice House",
        address: "Street 240",
        placeId: "places/abc",
      },
      {
        id: "google-2",
        source: "google",
        name: "Noodle Bar",
        address: "BKK1",
        placeId: "places/def",
      },
    ]

    const merged = mergeFoodPlaceSuggestions(local, google)
    assert.equal(merged[0]?.source, "local")
    assert.equal(merged[1]?.source, "local")
    assert.equal(merged[2]?.source, "google")
    assert.equal(merged[2]?.name, "Noodle Bar")
    assert.equal(merged.some((suggestion) => suggestion.source === "google" && suggestion.name === "Rice House"), false)

    const localOnly = mergeFoodPlaceSuggestions(
      [
        ...local,
        createFoodEntry("3", { name: "Third Place" }),
      ],
      google,
    )
    assert.equal(localOnly.length, 3)
    assert.equal(localOnly.every((suggestion) => suggestion.source === "local"), true)
  })

  it("recognizes Google Maps lookup URLs including short links", () => {
    assert.equal(isGoogleMapsLookupUrl("https://maps.app.goo.gl/abcd"), true)
    assert.equal(isGoogleMapsLookupUrl("https://www.google.com/maps/place/Rice+House"), true)
    assert.equal(isGoogleMapsLookupUrl("https://goo.gl/maps/xyz"), true)
    assert.equal(isGoogleMapsLookupUrl("https://example.com/maps"), false)
  })

  it("keeps Google photo resource names and rejects keyed media URLs", () => {
    const photoName = "places/ChIJ123/photos/ABCDE"
    const keyedUrl = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=800&key=secret`

    assert.equal(isGooglePlacePhotoName(photoName), true)
    assert.equal(isKeyedGoogleMediaUrl(keyedUrl), true)
    assert.deepEqual(
      extractGooglePlacePhotoNames([
        { name: photoName },
        keyedUrl,
        "https://places.googleapis.com/v1/places/other/photos/zzz/media?key=secret",
        { name: "not-a-photo" },
      ]),
      [photoName],
    )
  })

  it("maps place details onto form autofill fields including cuisine and photos", () => {
    const details: FoodPlaceDetailsResponse = {
      name: "Noodle Bar",
      address: "Street 308",
      website: "https://noodle.example",
      priceLevel: "2",
      neighborhood: "BKK1",
      city: "Phnom Penh",
      country: "Cambodia",
      googleMapsUrl: "https://maps.google.com/?cid=1",
      photos: [
        "places/abc/photos/one",
        "https://places.googleapis.com/v1/places/abc/photos/one/media?key=secret",
      ],
      latitude: 11.55,
      longitude: 104.92,
      suggestedCategory: "Cafe",
      suggestedCuisineTypes: ["Khmer", "Khmer", "Thai"],
    }

    const patch = mapPlaceDetailsToAutofillPatch(details)

    assert.equal(patch.priceLevel, "$$")
    assert.equal(patch.category, "Café")
    assert.deepEqual(patch.cuisineTypes, ["Khmer", "Thai"])
    assert.deepEqual(patch.photos, ["places/abc/photos/one"])
    assert.equal(patch.photos.some((photo) => photo.includes("key=")), false)
  })
})
