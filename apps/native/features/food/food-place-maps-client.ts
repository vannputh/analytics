import type { FoodPlaceDetailsRequest, FoodPlaceDetailsResponse, FoodPlaceSearchResponse } from "@analytics/domain"

import { buildApiUrl } from "@/lib/api"
import { supabase } from "@/lib/supabase"

export async function buildMapsAuthHeaders(init?: HeadersInit): Promise<Headers> {
  const headers = new Headers(init)
  if (!supabase) {
    return headers
  }

  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }
  return headers
}

interface MapsErrorResponseBody {
  details?: string
  error?: string
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  return (await response.json().catch(() => ({}))) as T
}

function buildTransportErrorMessage(endpointLabel: string, error: unknown) {
  const suffix =
    error instanceof Error && error.message && error.message !== "Network request failed"
      ? ` Details: ${error.message}`
      : ""

  return `Unable to reach the Expo ${endpointLabel}. Confirm EXPO_PUBLIC_API_URL points to the Expo server and that your phone can reach it.${suffix}`
}

function getResponseErrorMessage(responseBody: MapsErrorResponseBody, fallbackMessage: string) {
  return responseBody.error ?? responseBody.details ?? fallbackMessage
}

export function buildPlacePhotoUrl(photoName: string, maxWidthPx = 400) {
  const base = buildApiUrl("/api/maps/place-photo")
  const separator = base.includes("?") ? "&" : "?"
  return `${base}${separator}name=${encodeURIComponent(photoName)}&maxWidthPx=${String(maxWidthPx)}`
}

export async function searchPlacesFromApi(query: string) {
  let response: Response

  try {
    response = await fetch(buildApiUrl(`/api/maps/place-search?q=${encodeURIComponent(query)}`), {
      headers: await buildMapsAuthHeaders(),
    })
  } catch (error) {
    throw new Error(buildTransportErrorMessage("place search route", error))
  }

  const result = await parseJsonResponse<FoodPlaceSearchResponse & MapsErrorResponseBody>(response)

  if (!response.ok) {
    throw new Error(getResponseErrorMessage(result, "Failed to search places"))
  }

  return result.results ?? []
}

export async function fetchPlaceDetailsFromApi(request: FoodPlaceDetailsRequest) {
  let response: Response

  try {
    response = await fetch(buildApiUrl("/api/maps/place-details"), {
      method: "POST",
      headers: await buildMapsAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(request),
    })
  } catch (error) {
    throw new Error(buildTransportErrorMessage("place details route", error))
  }

  const result = await parseJsonResponse<FoodPlaceDetailsResponse & MapsErrorResponseBody>(response)

  if (!response.ok) {
    throw new Error(getResponseErrorMessage(result, "Failed to fetch place details"))
  }

  if (!result.name && !result.address && !result.googleMapsUrl) {
    throw new Error("Failed to fetch place details")
  }

  return result
}
