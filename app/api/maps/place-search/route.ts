import { NextRequest, NextResponse } from "next/server";
import type { FoodPlaceSearchResponse, FoodPlaceSuggestion } from "@/lib/food-place-types";

interface GoogleAddressComponent {
  longText?: string;
  types?: string[];
}

interface GooglePlaceSearchResult {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  googleMapsUri?: string;
  addressComponents?: GoogleAddressComponent[];
}

interface GooglePlaceSearchResponse {
  places?: GooglePlaceSearchResult[];
}

function normalizeText(value: string | null | undefined): string {
  if (!value) return "";
  return value.replace(/\s+/g, " ").trim();
}

function getCityAndCountry(components: GoogleAddressComponent[] | undefined): {
  city: string | null;
  country: string | null;
} {
  let city: string | null = null;
  let country: string | null = null;

  for (const component of components || []) {
    const types = component.types || [];
    if (!city && types.includes("locality")) {
      city = normalizeText(component.longText) || null;
    }
    if (!country && types.includes("country")) {
      country = normalizeText(component.longText) || null;
    }
  }

  return { city, country };
}

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q")?.trim() || "";
    if (q.length < 2) {
      return NextResponse.json<FoodPlaceSearchResponse>({ results: [] });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      // Graceful fallback to local-only autocomplete in the client.
      return NextResponse.json<FoodPlaceSearchResponse>({ results: [] });
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
    });

    if (!response.ok) {
      console.error("Place search request failed:", response.status, response.statusText);
      return NextResponse.json<FoodPlaceSearchResponse>({ results: [] });
    }

    const data = (await response.json()) as GooglePlaceSearchResponse;
    const results: FoodPlaceSuggestion[] = (data.places || []).map((place, index) => {
      const name = normalizeText(place.displayName?.text) || normalizeText(place.formattedAddress) || "Unknown place";
      const address = normalizeText(place.formattedAddress) || null;
      const { city, country } = getCityAndCountry(place.addressComponents);

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
      };
    });

    return NextResponse.json<FoodPlaceSearchResponse>({ results });
  } catch (error) {
    console.error("Place search API error:", error);
    return NextResponse.json<FoodPlaceSearchResponse>({ results: [] });
  }
}
