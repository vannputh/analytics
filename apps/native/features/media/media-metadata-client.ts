import type { MediaMetadata } from "@analytics/domain"

import type { MetadataSearchResult } from "@/features/media/media-types"

interface MetadataErrorResponseBody {
  details?: string
  error?: string
  provider?: "omdb" | "tmdb"
  status?: number
}

interface MetadataResponseBody extends MetadataErrorResponseBody {
  metadata?: MediaMetadata
}

interface MetadataSearchResponseBody extends MetadataErrorResponseBody {
  results?: MetadataSearchResult[]
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

function getResponseErrorMessage(
  responseBody: MetadataErrorResponseBody,
  fallbackMessage: string,
) {
  return responseBody.error ?? responseBody.details ?? fallbackMessage
}

export async function searchMetadataFromApi(url: string) {
  let response: Response

  try {
    response = await fetch(url)
  } catch (error) {
    throw new Error(buildTransportErrorMessage("metadata search route", error))
  }

  const result = await parseJsonResponse<MetadataSearchResponseBody>(response)

  if (!response.ok) {
    throw new Error(getResponseErrorMessage(result, "Failed to search metadata"))
  }

  return result.results ?? []
}

export async function fetchMetadataFromApi(url: string) {
  let response: Response

  try {
    response = await fetch(url)
  } catch (error) {
    throw new Error(buildTransportErrorMessage("metadata route", error))
  }

  const result = await parseJsonResponse<MetadataResponseBody>(response)

  if (!response.ok || !result.metadata) {
    throw new Error(getResponseErrorMessage(result, "Failed to fetch metadata"))
  }

  return result.metadata
}
