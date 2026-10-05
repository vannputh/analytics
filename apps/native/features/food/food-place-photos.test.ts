import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  createGooglePhotoDrafts,
  mergePlacePhotoDrafts,
  type FoodPlacePhotoDraft,
} from "@/features/food/food-place-photos"

describe("food place photo drafts", () => {
  it("merges Google photo names after stored images and keeps library picks", () => {
    const current: FoodPlacePhotoDraft[] = [
      {
        id: "stored-1",
        kind: "stored",
        imageUrl: "https://storage.example/food-images/entry-1/place.jpg",
      },
      {
        id: "library-1",
        kind: "library",
        uri: "file://photo.jpg",
        mimeType: "image/jpeg",
        fileName: "photo.jpg",
      },
    ]

    const merged = mergePlacePhotoDrafts(current, createGooglePhotoDrafts(["places/abc/photos/one"]))

    assert.deepEqual(
      merged.map((draft) => draft.kind),
      ["stored", "google", "library"],
    )
    assert.equal(merged[1]?.kind === "google" ? merged[1].photoName : null, "places/abc/photos/one")
  })
})
