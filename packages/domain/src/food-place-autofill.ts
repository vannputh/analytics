import type { FoodEntry } from "./database.types"
import type { FoodPlaceDetailsResponse, FoodPlaceSuggestion } from "./food-place-types"
import { CATEGORIES, PRICE_LEVELS, type PriceLevel } from "./food-types"

export const GOOGLE_PLACE_SEARCH_FALLBACK_THRESHOLD = 3
export const GOOGLE_PLACE_PHOTO_NAME_PATTERN = /^places\/[^/]+\/photos\/[^/]+$/

const GOOGLE_MAPS_LOOKUP_PATTERN =
  /google\.com\/maps|maps\.google|goo\.gl\/maps|maps\.app\.goo\.gl/i
const KEYED_GOOGLE_MEDIA_URL_PATTERN = /[?&]key=/i
const GOOGLE_PLACE_MEDIA_URL_PATTERN = /places\.googleapis\.com\/v1\/.+\/media/i

const PRICE_LEVEL_ALIASES: Record<string, PriceLevel> = {
  "1": "$",
  "2": "$$",
  "3": "$$$",
  "4": "$$$$",
  PRICE_LEVEL_INEXPENSIVE: "$",
  PRICE_LEVEL_MODERATE: "$$",
  PRICE_LEVEL_EXPENSIVE: "$$$",
  PRICE_LEVEL_VERY_EXPENSIVE: "$$$$",
}

const CATEGORY_ALIASES: Record<string, string> = {
  cafe: "Café",
  café: "Café",
}

export type LocalFoodPlaceSuggestion = FoodPlaceSuggestion & {
  source: "local"
  entry: FoodEntry
}

export type GoogleFoodPlaceSuggestion = FoodPlaceSuggestion & {
  source: "google"
}

export type MergedFoodPlaceSuggestion = LocalFoodPlaceSuggestion | GoogleFoodPlaceSuggestion

export interface FoodPlaceAutofillPatch {
  address: string
  category: string | null
  city: string | null
  country: string | null
  cuisineTypes: string[]
  googleMapsUrl: string
  latitude: number | null
  longitude: number | null
  name: string
  neighborhood: string | null
  photos: string[]
  priceLevel: PriceLevel | null
  websiteUrl: string
}

function normalizeText(value: string | null | undefined) {
  return value?.trim().toLowerCase().replace(/\s+/g, " ") ?? ""
}

function suggestionDedupeKey(suggestion: Pick<FoodPlaceSuggestion, "address" | "branch" | "name">) {
  return `${normalizeText(suggestion.name)}|${normalizeText(suggestion.branch)}|${normalizeText(suggestion.address)}`
}

export function isGoogleMapsLookupUrl(value: string) {
  return GOOGLE_MAPS_LOOKUP_PATTERN.test(value.trim())
}

export function isGooglePlacePhotoName(value: string) {
  return GOOGLE_PLACE_PHOTO_NAME_PATTERN.test(value.trim())
}

export function isKeyedGoogleMediaUrl(value: string) {
  return GOOGLE_PLACE_MEDIA_URL_PATTERN.test(value) && KEYED_GOOGLE_MEDIA_URL_PATTERN.test(value)
}

export function extractGooglePlacePhotoNames(
  photos: Array<{ name?: string } | string | null | undefined> | null | undefined,
  limit = 5,
) {
  const names: string[] = []

  for (const photo of photos ?? []) {
    const candidate = typeof photo === "string" ? photo.trim() : photo?.name?.trim()
    if (!candidate || !isGooglePlacePhotoName(candidate) || isKeyedGoogleMediaUrl(candidate)) {
      continue
    }

    if (names.includes(candidate)) {
      continue
    }

    names.push(candidate)

    if (names.length >= limit) {
      break
    }
  }

  return names
}

export function mapGooglePriceLevelToChip(value: string | null | undefined): PriceLevel | null {
  const trimmed = value?.trim()
  if (!trimmed) {
    return null
  }

  if ((PRICE_LEVELS as readonly string[]).includes(trimmed)) {
    return trimmed as PriceLevel
  }

  return PRICE_LEVEL_ALIASES[trimmed] ?? null
}

export function mapSuggestedCategory(value: string | null | undefined) {
  const trimmed = value?.trim()
  if (!trimmed) {
    return null
  }

  const alias = CATEGORY_ALIASES[trimmed.toLowerCase()]
  if (alias) {
    return alias
  }

  if ((CATEGORIES as readonly string[]).includes(trimmed)) {
    return trimmed
  }

  return trimmed
}

export function mapSuggestedCuisines(values: string[] | null | undefined) {
  const next: string[] = []

  for (const value of values ?? []) {
    const trimmed = value.trim()
    if (!trimmed || next.includes(trimmed)) {
      continue
    }

    next.push(trimmed)
  }

  return next
}

export function toLocalFoodPlaceSuggestion(entry: FoodEntry): LocalFoodPlaceSuggestion {
  return {
    id: `local-${entry.id}`,
    source: "local",
    name: entry.name,
    branch: entry.branch,
    address: entry.address,
    subtitle: [entry.branch, entry.city, entry.country].filter(Boolean).join(" · ") || entry.address || null,
    placeId: null,
    googleMapsUrl: entry.google_maps_url,
    city: entry.city,
    country: entry.country,
    entry,
  }
}

export function mergeFoodPlaceSuggestions(
  localEntries: FoodEntry[],
  googleResults: FoodPlaceSuggestion[],
  options?: { googleFallbackThreshold?: number },
): MergedFoodPlaceSuggestion[] {
  const threshold = options?.googleFallbackThreshold ?? GOOGLE_PLACE_SEARCH_FALLBACK_THRESHOLD
  const local = localEntries.map(toLocalFoodPlaceSuggestion)

  if (local.length >= threshold) {
    return local
  }

  const existingKeys = new Set(local.map(suggestionDedupeKey))
  const google: GoogleFoodPlaceSuggestion[] = []

  for (const result of googleResults) {
    const suggestion: GoogleFoodPlaceSuggestion = { ...result, source: "google" }
    const key = suggestionDedupeKey(suggestion)

    if (existingKeys.has(key)) {
      continue
    }

    existingKeys.add(key)
    google.push(suggestion)
  }

  return [...local, ...google]
}

export function mapPlaceDetailsToAutofillPatch(
  details: FoodPlaceDetailsResponse,
): FoodPlaceAutofillPatch {
  return {
    name: details.name,
    address: details.address,
    websiteUrl: details.website,
    neighborhood: details.neighborhood,
    city: details.city,
    country: details.country,
    priceLevel: mapGooglePriceLevelToChip(details.priceLevel),
    googleMapsUrl: details.googleMapsUrl,
    latitude: details.latitude ?? null,
    longitude: details.longitude ?? null,
    category: mapSuggestedCategory(details.suggestedCategory),
    cuisineTypes: mapSuggestedCuisines(details.suggestedCuisineTypes),
    photos: extractGooglePlacePhotoNames(details.photos),
  }
}
