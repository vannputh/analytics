import type { FoodPlaceSearchResponse, FoodPlaceSuggestion } from "@analytics/domain"

import { requireRequestUser } from "@/lib/server-auth"

interface GoogleAddressComponent {
  longText?: string
  types?: string[]
}

interface GooglePlaceSearchResult {
  id?: string
  displayName?: { text?: string }
  formattedAddress?: string
  googleMapsUri?: string
  addressComponents?: GoogleAddressComponent[]
}

interface GooglePlaceSearchResponse {
  places?: GooglePlaceSearchResult[]
}

function normalizeText(value: string | null | undefined): string {
  return value ? value.replace(/\s+/g, " ").trim() : ""
}

function getCityAndCountry(components: GoogleAddressComponent[] | undefined) {
  let city: string | null = null
  let country: string | null = null

  for (const component of components || []) {
    const types = component.types || []
    if (!city && types.includes("locality")) {
      city = normalizeText(component.longText) || null
    }
    if (!country && types.includes("country")) {
      country = normalizeText(component.longText) || null
    }
  }

  return { city, country }
}

export async function GET(request: Request) {
  try {
    const unauthorized = await requireRequestUser(request)
    if (unauthorized) return unauthorized

    const url = new URL(request.url)
    const q = url.searchParams.get("q")?.trim() || ""

    if (q.length < 2) {
      return Response.json({ results: [] } satisfies FoodPlaceSearchResponse)
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      return Response.json({ results: [] } satisfies FoodPlaceSearchResponse)
    }

    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.googleMapsUri,places.addressComponents",
      },
      body: JSON.stringify({
        textQuery: q,
        maxResultCount: 8,
      }),
    })

    if (!response.ok) {
      return Response.json({ results: [] } satisfies FoodPlaceSearchResponse)
    }

    const data = (await response.json()) as GooglePlaceSearchResponse

    const results: FoodPlaceSuggestion[] = (data.places || []).map((place, index) => {
      const name =
        normalizeText(place.displayName?.text) || normalizeText(place.formattedAddress) || "Unknown place"
      const address = normalizeText(place.formattedAddress) || null
      const { city, country } = getCityAndCountry(place.addressComponents)

      return {
        id: place.id || `google-${index}-${name.toLowerCase().replace(/\s+/g, "-")}`,
        source: "google",
        name,
        address,
        subtitle: address,
        placeId: place.id || null,
        googleMapsUrl: normalizeText(place.googleMapsUri) || null,
        city,
        country,
      }
    })

    return Response.json({ results } satisfies FoodPlaceSearchResponse)
  } catch (error) {
    console.error("Expo place-search route error:", error)
    return Response.json({ results: [] } satisfies FoodPlaceSearchResponse)
  }
}
