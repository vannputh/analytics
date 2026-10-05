import type { FoodEntryImage } from "@analytics/domain"

export type FoodPlacePhotoDraft =
  | {
      fileName: string
      id: string
      kind: "library"
      mimeType: string
      uri: string
    }
  | {
      id: string
      kind: "google"
      photoName: string
    }
  | {
      id: string
      imageUrl: string
      kind: "stored"
      storagePath?: string
    }

export function createGooglePhotoDrafts(photoNames: string[]): FoodPlacePhotoDraft[] {
  return photoNames.map((photoName) => ({
    id: `google-${photoName}`,
    kind: "google" as const,
    photoName,
  }))
}

export function createStoredPhotoDrafts(images: FoodEntryImage[]): FoodPlacePhotoDraft[] {
  return images.map((image) => ({
    id: image.id,
    kind: "stored" as const,
    imageUrl: image.image_url,
    storagePath: image.storage_path,
  }))
}

export function mergePlacePhotoDrafts(
  current: FoodPlacePhotoDraft[],
  nextGoogle: FoodPlacePhotoDraft[],
): FoodPlacePhotoDraft[] {
  const stored = current.filter((draft) => draft.kind === "stored")
  const library = current.filter((draft) => draft.kind === "library")
  const existingGoogleNames = new Set(
    nextGoogle.filter((draft) => draft.kind === "google").map((draft) => draft.photoName),
  )
  const uniqueGoogle = nextGoogle.filter((draft) => {
    if (draft.kind !== "google") {
      return true
    }

    return existingGoogleNames.delete(draft.photoName)
  })

  return [...stored, ...uniqueGoogle, ...library]
}

export function canRemovePlacePhotoDraft(draft: FoodPlacePhotoDraft) {
  return draft.kind !== "stored"
}
