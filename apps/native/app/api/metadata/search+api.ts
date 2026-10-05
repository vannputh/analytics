import { searchOMDB } from "@/lib/services/omdb"
import {
  fetchProviderJson,
  getProviderErrorPayload,
  isProviderFetchError,
} from "@/lib/services/provider-fetch"
import type { MetadataSearchSource } from "../../../features/media/media-types"

interface TMDBSearchResult {
  id: number
  title?: string
  name?: string
  release_date?: string
  first_air_date?: string
  poster_path?: string
  media_type?: string
}

interface TMDBSearchResponse {
  results?: TMDBSearchResult[]
}

interface SearchResult {
  id: string
  title: string
  year: string | null
  poster_url: string | null
  media_type: "movie" | "tv"
  source: MetadataSearchSource
  imdb_id?: string
}

async function searchTMDBMulti(query: string, apiKey: string): Promise<SearchResult[]> {
  const url = `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(query)}&page=1`
  const data = await fetchProviderJson<TMDBSearchResponse>(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
    operation: `searching metadata for "${query}"`,
    provider: "tmdb",
  })

  return (data.results ?? [])
    .filter((item) => item.media_type === "movie" || item.media_type === "tv")
    .slice(0, 8)
    .map((item) => ({
      id: `tmdb_${item.media_type}_${item.id}`,
      title: item.title || item.name || "Unknown",
      year: item.release_date?.substring(0, 4) || item.first_air_date?.substring(0, 4) || null,
      poster_url: item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : null,
      media_type: item.media_type === "movie" ? "movie" : "tv",
      source: "tmdb",
    }))
}

function getErrorStatus(error: unknown) {
  if (isProviderFetchError(error)) {
    return error.status ?? 502
  }

  return 500
}

async function searchOMDBFallback(query: string, apiKey: string): Promise<SearchResult[]> {
  const results = await searchOMDB(query, apiKey)
  return results.slice(0, 8).map((item) => ({
    id: `omdb_${item.imdbID}`,
    title: item.Title || "Unknown",
    year: item.Year || null,
    poster_url: item.Poster && item.Poster !== "N/A" ? item.Poster : null,
    media_type: item.Type === "series" ? "tv" : "movie",
    source: "omdb",
    imdb_id: item.imdbID,
  }))
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const query = url.searchParams.get("q")

    if (!query || query.trim().length < 2) {
      return Response.json({ results: [] })
    }

    const tmdbApiKey = process.env.TMDB_API_KEY
    const omdbApiKey = process.env.OMDB_API_KEY

    if (!tmdbApiKey && !omdbApiKey) {
      return Response.json(
        { error: "TMDB_API_KEY or OMDB_API_KEY must be configured", results: [] },
        { status: 500 },
      )
    }

    let results: SearchResult[] = []
    const providerErrors: unknown[] = []

    if (tmdbApiKey) {
      try {
        results = await searchTMDBMulti(query.trim(), tmdbApiKey)
      } catch (error) {
        providerErrors.push(error)
      }
    }

    if (!results.length && omdbApiKey) {
      try {
        results = await searchOMDBFallback(query.trim(), omdbApiKey)
      } catch (error) {
        providerErrors.push(error)
      }
    }

    if (!results.length && providerErrors.length > 0) {
      const error = providerErrors[0]
      return Response.json(
        {
          ...getProviderErrorPayload(error, "Failed to search metadata"),
          results: [],
        },
        { status: getErrorStatus(error) },
      )
    }

    return Response.json({ results })
  } catch (error) {
    console.error("Expo metadata search route error:", error)
    return Response.json({ error: "Failed to search", results: [] }, { status: 500 })
  }
}
