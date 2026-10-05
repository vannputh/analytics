import type { FoodEntry, FoodEntryInsert, FoodPlaceAutofillPatch } from "@analytics/domain"

import { formatLocalDateKey, parseCurrencyInput } from "@/features/food/food-ui"

export interface FoodItemDraft {
  categoriesText: string
  category: string
  name: string
  price: string
}

export interface FoodFormState {
  address: string
  ambianceRating: number | null
  branch: string
  category: string
  city: string
  country: string
  cuisineTypes: string[]
  currency: string
  diningType: string
  favoriteItem: string
  foodRating: number | null
  googleMapsUrl: string
  instagramHandle: string
  items: FoodItemDraft[]
  latitude: string
  longitude: string
  name: string
  neighborhood: string
  notes: string
  overallRating: number | null
  priceLevel: string
  serviceRating: number | null
  tags: string[]
  totalPrice: string
  valueRating: number | null
  visitDate: string
  websiteUrl: string
  wouldReturn: boolean | null
}

export function createEmptyFormState(initialDate?: string): FoodFormState {
  return {
    address: "",
    ambianceRating: null,
    branch: "",
    category: "",
    city: "",
    country: "Cambodia",
    cuisineTypes: [],
    currency: "USD",
    diningType: "",
    favoriteItem: "",
    foodRating: null,
    googleMapsUrl: "",
    instagramHandle: "",
    items: [],
    latitude: "",
    longitude: "",
    name: "",
    neighborhood: "",
    notes: "",
    overallRating: null,
    priceLevel: "",
    serviceRating: null,
    tags: [],
    totalPrice: "",
    valueRating: null,
    visitDate: initialDate ?? formatLocalDateKey(),
    websiteUrl: "",
    wouldReturn: null,
  }
}

export function createFormStateFromSource(
  source: Partial<FoodEntryInsert> | FoodEntry | null | undefined,
  fallbackDate: string,
): FoodFormState {
  if (!source) {
    return createEmptyFormState(fallbackDate)
  }

  return {
    address: source.address ?? "",
    ambianceRating: source.ambiance_rating ?? null,
    branch: source.branch ?? "",
    category: source.category ?? "",
    city: source.city ?? "",
    country: source.country ?? "Cambodia",
    cuisineTypes: source.cuisine_type ?? [],
    currency: source.currency ?? "USD",
    diningType: source.dining_type ?? "",
    favoriteItem: source.favorite_item ?? "",
    foodRating: source.food_rating ?? null,
    googleMapsUrl: source.google_maps_url ?? "",
    instagramHandle: source.instagram_handle ?? "",
    items:
      source.items_ordered?.map((item) => ({
        categoriesText: item.categories?.join(", ") ?? "",
        category: item.category ?? "",
        name: item.name,
        price: typeof item.price === "number" ? String(item.price) : "",
      })) ?? [],
    latitude: typeof source.latitude === "number" ? String(source.latitude) : "",
    longitude: typeof source.longitude === "number" ? String(source.longitude) : "",
    name: source.name ?? "",
    neighborhood: source.neighborhood ?? "",
    notes: source.notes ?? "",
    overallRating: source.overall_rating ?? null,
    priceLevel: source.price_level ?? "",
    serviceRating: source.service_rating ?? null,
    tags: source.tags ?? [],
    totalPrice: typeof source.total_price === "number" ? String(source.total_price) : "",
    valueRating: source.value_rating ?? null,
    visitDate: source.visit_date ?? fallbackDate,
    websiteUrl: source.website_url ?? "",
    wouldReturn: source.would_return ?? null,
  }
}

export function isValidDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const date = new Date(`${value}T12:00:00`)
  return !Number.isNaN(date.getTime())
}

export function parseDateKey(value: string) {
  if (!isValidDateKey(value)) {
    return new Date()
  }

  return new Date(`${value}T12:00:00`)
}

export function toggleValue(values: string[], nextValue: string) {
  return values.includes(nextValue)
    ? values.filter((value) => value !== nextValue)
    : [...values, nextValue]
}

function nullIfBlank(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function parseOptionalNumber(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeArray(values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean)
}

export function createEmptyItemDraft(): FoodItemDraft {
  return { categoriesText: "", category: "", name: "", price: "" }
}

export function buildFoodPayload(form: FoodFormState) {
  const items = form.items
    .map((item) => ({
      name: item.name.trim(),
      price: parseCurrencyInput(item.price),
      image_url: null,
      category: nullIfBlank(item.category),
      categories: normalizeArray(item.categoriesText.split(",")),
    }))
    .filter((item) => item.name.length > 0)
    .map((item) => ({
      ...item,
      categories: item.categories.length > 0 ? item.categories : null,
    }))

  return {
    name: form.name.trim(),
    branch: nullIfBlank(form.branch),
    visit_date: form.visitDate,
    category: nullIfBlank(form.category),
    address: nullIfBlank(form.address),
    google_maps_url: nullIfBlank(form.googleMapsUrl),
    latitude: parseOptionalNumber(form.latitude),
    longitude: parseOptionalNumber(form.longitude),
    neighborhood: nullIfBlank(form.neighborhood),
    city: nullIfBlank(form.city),
    country: nullIfBlank(form.country),
    instagram_handle: nullIfBlank(form.instagramHandle)?.replace(/^@/, ""),
    website_url: nullIfBlank(form.websiteUrl),
    items_ordered: items.length > 0 ? items : null,
    favorite_item: nullIfBlank(form.favoriteItem),
    overall_rating: form.overallRating,
    food_rating: form.foodRating,
    ambiance_rating: form.ambianceRating,
    service_rating: form.serviceRating,
    value_rating: form.valueRating,
    total_price: parseCurrencyInput(form.totalPrice),
    currency: nullIfBlank(form.currency) ?? "USD",
    price_level: nullIfBlank(form.priceLevel),
    cuisine_type: form.cuisineTypes.length > 0 ? form.cuisineTypes : null,
    dining_type: nullIfBlank(form.diningType),
    tags: form.tags.length > 0 ? form.tags : null,
    would_return: form.wouldReturn,
    notes: nullIfBlank(form.notes),
  }
}

export function applyPlaceSuggestion(form: FoodFormState, entry: FoodEntry): FoodFormState {
  return {
    ...form,
    name: entry.name,
    branch: entry.branch ?? form.branch,
    category: entry.category ?? form.category,
    address: entry.address ?? form.address,
    googleMapsUrl: entry.google_maps_url ?? form.googleMapsUrl,
    latitude: typeof entry.latitude === "number" ? String(entry.latitude) : form.latitude,
    longitude: typeof entry.longitude === "number" ? String(entry.longitude) : form.longitude,
    neighborhood: entry.neighborhood ?? form.neighborhood,
    city: entry.city ?? form.city,
    country: entry.country ?? form.country,
    instagramHandle: entry.instagram_handle ?? form.instagramHandle,
    websiteUrl: entry.website_url ?? form.websiteUrl,
    cuisineTypes: entry.cuisine_type?.length ? entry.cuisine_type : form.cuisineTypes,
    diningType: entry.dining_type ?? form.diningType,
    priceLevel: entry.price_level ?? form.priceLevel,
  }
}

export function applyPlaceDetailsPatch(
  form: FoodFormState,
  patch: FoodPlaceAutofillPatch,
): FoodFormState {
  return {
    ...form,
    name: patch.name || form.name,
    address: patch.address || form.address,
    websiteUrl: patch.websiteUrl || form.websiteUrl,
    neighborhood: patch.neighborhood ?? form.neighborhood,
    city: patch.city ?? form.city,
    country: patch.country ?? form.country,
    priceLevel: patch.priceLevel ?? form.priceLevel,
    googleMapsUrl: patch.googleMapsUrl || form.googleMapsUrl,
    latitude: typeof patch.latitude === "number" ? String(patch.latitude) : form.latitude,
    longitude: typeof patch.longitude === "number" ? String(patch.longitude) : form.longitude,
    category: form.category.trim() ? form.category : patch.category ?? form.category,
    cuisineTypes: patch.cuisineTypes.length
      ? Array.from(new Set([...form.cuisineTypes, ...patch.cuisineTypes]))
      : form.cuisineTypes,
  }
}
