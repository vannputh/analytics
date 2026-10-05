import { normalizeLanguage } from "@analytics/domain"

const OMDB_API_KEY = process.env.OMDB_API_KEY

interface OMDBResponse {
  Title: string
  Year: string
  Runtime: string
  Genre: string
  Plot: string
  Language: string
  Poster: string
  imdbRating: string
  imdbID: string
  Type: string
  totalSeasons?: string
  Director: string
  Actors: string
  Response: string
  Error?: string
}

function mapOMDBTypeToMedium(omdbType: string): string {
  const typeMap: Record<string, string> = {
    movie: "Movie",
    series: "TV Show",
    episode: "TV Show",
  }

  return typeMap[omdbType.toLowerCase()] || "Movie"
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const title = url.searchParams.get("title")
    const year = url.searchParams.get("year")
    const type = url.searchParams.get("type")

    if (!title) {
      return Response.json({ error: "Title parameter is required" }, { status: 400 })
    }

    if (!OMDB_API_KEY) {
      return Response.json({ error: "OMDB API key not configured" }, { status: 500 })
    }

    const omdbUrl = new URL("https://www.omdbapi.com/")
    omdbUrl.searchParams.set("apikey", OMDB_API_KEY)
    omdbUrl.searchParams.set("t", title)

    if (year) {
      omdbUrl.searchParams.set("y", year)
    }

    if (type) {
      omdbUrl.searchParams.set("type", type)
    }

    const response = await fetch(omdbUrl.toString())
    const data = (await response.json()) as OMDBResponse

    if (data.Response === "False") {
      return Response.json({ error: data.Error || "Movie not found" }, { status: 404 })
    }

    return Response.json({
      title: data.Title,
      year: data.Year,
      poster_url: data.Poster !== "N/A" ? data.Poster : null,
      average_rating: data.imdbRating !== "N/A" ? parseFloat(data.imdbRating) : null,
      imdb_id: data.imdbID,
      medium: mapOMDBTypeToMedium(data.Type),
      type: data.Genre !== "N/A" ? data.Genre : null,
      language: data.Language !== "N/A" ? normalizeLanguage(data.Language).join(", ") : null,
      length: data.Runtime !== "N/A" ? data.Runtime : null,
      totalSeasons: data.totalSeasons,
      plot: data.Plot !== "N/A" ? data.Plot : null,
      director: data.Director !== "N/A" ? data.Director : null,
      actors: data.Actors !== "N/A" ? data.Actors : null,
    })
  } catch (error) {
    console.error("Expo OMDB route error:", error)
    return Response.json({ error: "Failed to fetch movie data" }, { status: 500 })
  }
}
