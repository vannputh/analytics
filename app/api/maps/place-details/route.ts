import { NextRequest, NextResponse } from "next/server";
import type { FoodPlaceDetailsRequest, FoodPlaceDetailsResponse } from "@/lib/food-place-types";
import {
  inferCategoryFromPlaceTypes,
  inferCuisineTypesFromPlaceTypes,
  normalizeGooglePlaceTypes,
} from "@/lib/food-place-inference";
import { requireAuth } from "@/lib/api-auth";

interface GoogleAddressComponent {
  longText?: string;
  types?: string[];
}

interface GooglePlacePhoto {
  name?: string;
}

interface GooglePlaceLocation {
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
}

interface GooglePlaceData {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  priceLevel?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  primaryType?: string;
  types?: string[];
  location?: GooglePlaceLocation;
  addressComponents?: GoogleAddressComponent[];
  photos?: GooglePlacePhoto[];
}

interface GoogleTextSearchResponse {
  places?: GooglePlaceData[];
}

function normalizeText(value: string | null | undefined): string {
  if (!value) return "";
  return value.replace(/\s+/g, " ").trim();
}

function normalizeNullable(value: string | null | undefined): string | null {
  const normalized = normalizeText(value);
  return normalized || null;
}

async function expandShortMapsUrl(url: string): Promise<string> {
  let fullUrl = url;
  let redirectCount = 0;
  const maxRedirects = 5;

  while ((fullUrl.includes("goo.gl") || fullUrl.includes("maps.app.goo.gl")) && redirectCount < maxRedirects) {
    try {
      const response = await fetch(fullUrl, {
        method: "HEAD",
        redirect: "manual",
      });
      const location = response.headers.get("location");
      if (!location) break;
      fullUrl = location.startsWith("http") ? location : new URL(location, fullUrl).href;
      redirectCount++;
    } catch (error) {
      console.error("Error expanding short URL:", error);
      break;
    }
  }

  return fullUrl;
}

function extractLookupData(url: string): {
  placeId: string | null;
  query: string | null;
  coords: { lat: number; lng: number } | null;
} {
  let placeId: string | null = null;
  let query: string | null = null;
  let coords: { lat: number; lng: number } | null = null;

  try {
    const urlObj = new URL(url);
    placeId = urlObj.searchParams.get("place_id") || urlObj.searchParams.get("ftid");

    const coordMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (coordMatch) {
      coords = {
        lat: parseFloat(coordMatch[1]),
        lng: parseFloat(coordMatch[2]),
      };
    }

    if (!placeId) {
      const placeRegex = /\/maps\/(?:place|search)\/([^\/@?]+)/;
      const match = url.match(placeRegex);
      if (match?.[1]) {
        query = decodeURIComponent(match[1]).replace(/\+/g, " ");
      }
    }

    if (!placeId && !query) {
      query = urlObj.searchParams.get("q") || urlObj.searchParams.get("query");
    }
  } catch (error) {
    console.error("URL parsing error:", error);
  }

  return { placeId, query, coords };
}

async function fetchPlaceById(placeId: string, apiKey: string): Promise<GooglePlaceData | null> {
  const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "id,displayName,formattedAddress,priceLevel,websiteUri,googleMapsUri,primaryType,types,location,addressComponents,photos",
    },
  });

  if (!response.ok) return null;
  return (await response.json()) as GooglePlaceData;
}

async function fetchPlaceBySearch(
  query: string | null,
  coords: { lat: number; lng: number } | null,
  apiKey: string
): Promise<GooglePlaceData | null> {
  if (!query && !coords) return null;

  const searchBody: {
    textQuery: string;
    maxResultCount: number;
    locationBias?: {
      circle: {
        center: { latitude: number; longitude: number };
        radius: number;
      };
    };
  } = {
    textQuery: query || "restaurant",
    maxResultCount: 1,
  };

  if (coords) {
    searchBody.locationBias = {
      circle: {
        center: {
          latitude: coords.lat,
          longitude: coords.lng,
        },
        radius: 500,
      },
    };
  }

  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.priceLevel,places.websiteUri,places.googleMapsUri,places.primaryType,places.types,places.location,places.addressComponents,places.photos",
    },
    body: JSON.stringify(searchBody),
  });

  if (!response.ok) return null;
  const data = (await response.json()) as GoogleTextSearchResponse;
  return data.places?.[0] || null;
}

function getAddressFields(components: GoogleAddressComponent[] | undefined): {
  neighborhood: string | null;
  city: string | null;
  country: string | null;
} {
  let neighborhood: string | null = null;
  let city: string | null = null;
  let country: string | null = null;

  for (const component of components || []) {
    const types = component.types || [];
    if (!neighborhood && (types.includes("sublocality") || types.includes("neighborhood"))) {
      neighborhood = normalizeNullable(component.longText);
    }
    if (!city && types.includes("locality")) {
      city = normalizeNullable(component.longText);
    }
    if (!country && types.includes("country")) {
      country = normalizeNullable(component.longText);
    }
  }

  return { neighborhood, city, country };
}

export async function POST(request: NextRequest) {
  try {
    const unauthorized = await requireAuth();
    if (unauthorized) return unauthorized;

    const body = (await request.json()) as FoodPlaceDetailsRequest;
    const rawUrl = normalizeText(body.url);
    let placeId = normalizeNullable(body.placeId);

    if (!rawUrl && !placeId) {
      return NextResponse.json({ error: "Either url or placeId is required" }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GOOGLE_MAPS_API_KEY is not configured" }, { status: 500 });
    }

    let fullUrl = rawUrl;
    if (fullUrl) {
      fullUrl = await expandShortMapsUrl(fullUrl);
    }

    let query: string | null = null;
    let coords: { lat: number; lng: number } | null = null;

    if (!placeId && fullUrl) {
      const lookup = extractLookupData(fullUrl);
      placeId = lookup.placeId;
      query = lookup.query;
      coords = lookup.coords;
    }

    let placeData: GooglePlaceData | null = null;
    if (placeId) {
      placeData = await fetchPlaceById(placeId, apiKey);
    }

    if (!placeData) {
      placeData = await fetchPlaceBySearch(query, coords, apiKey);
    }

    if (!placeData) {
      return NextResponse.json(
        { error: "Could not identify place from input or search returned no results" },
        { status: 404 }
      );
    }

    const priceLevelMap: Record<string, string> = {
      PRICE_LEVEL_INEXPENSIVE: "1",
      PRICE_LEVEL_MODERATE: "2",
      PRICE_LEVEL_EXPENSIVE: "3",
      PRICE_LEVEL_VERY_EXPENSIVE: "4",
    };

    const { neighborhood, city, country } = getAddressFields(placeData.addressComponents);

    const photoUrls: string[] = [];
    for (const photo of (placeData.photos || []).slice(0, 5)) {
      if (!photo.name) continue;
      photoUrls.push(`https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=800&key=${apiKey}`);
    }

    const latitude = placeData.location?.latitude ?? placeData.location?.lat ?? null;
    const longitude = placeData.location?.longitude ?? placeData.location?.lng ?? null;
    const placeTypes = normalizeGooglePlaceTypes(placeData.primaryType, placeData.types);
    const suggestedCategory = inferCategoryFromPlaceTypes(placeTypes);
    const suggestedCuisineTypes = inferCuisineTypesFromPlaceTypes(placeTypes);
    const normalizedName = normalizeText(placeData.displayName?.text);
    const normalizedAddress = normalizeText(placeData.formattedAddress);
    const fallbackMapsUrl = placeId
      ? `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(placeId)}`
      : "";
    const googleMapsUrl = normalizeText(placeData.googleMapsUri) || fullUrl || fallbackMapsUrl;

    const payload: FoodPlaceDetailsResponse = {
      name: normalizedName,
      address: normalizedAddress,
      website: normalizeText(placeData.websiteUri),
      priceLevel: priceLevelMap[placeData.priceLevel || ""] || null,
      neighborhood,
      city,
      country: country || "Cambodia",
      googleMapsUrl,
      photos: photoUrls.length > 0 ? photoUrls : null,
      placeId: placeData.id || placeId,
      latitude,
      longitude,
      placeTypes: placeTypes.length > 0 ? placeTypes : null,
      suggestedCategory,
      suggestedCuisineTypes: suggestedCuisineTypes.length > 0 ? suggestedCuisineTypes : null,
      normalized: {
        name: normalizedName,
        address: normalizedAddress,
        neighborhood,
        city,
        country: country || "Cambodia",
      },
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Maps API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
