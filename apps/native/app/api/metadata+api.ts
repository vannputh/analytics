import {
  fetchTMDBMovie,
  fetchTMDBTV,
  findTMDBByIMDb,
  formatRuntime,
  getTMDBPosterUrl,
  searchTMDB,
  type TMDBMovieResponse,
  type TMDBTVResponse,
} from "@/lib/services/tmdb"
import {
  fetchOMDBByIMDbId,
  fetchOMDBByTitle,
  findBestOMDBMatch,
  mapOMDBType,
  searchOMDB,
  type OMDBResponse,
} from "@/lib/services/omdb"
import {
  getProviderErrorPayload,
  isProviderFetchError,
} from "@/lib/services/provider-fetch"
import { normalizeLanguage } from "@analytics/domain"

function getErrorStatus(error: unknown) {
  if (isProviderFetchError(error)) {
    return error.status ?? 502
  }

  return 500
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const title = url.searchParams.get("title")
    const imdbIdParam = url.searchParams.get("imdb_id")
    const tmdbIdParam = url.searchParams.get("tmdb_id")
    const type = url.searchParams.get("type")
    const year = url.searchParams.get("year")
    const season = url.searchParams.get("season")
    const source = url.searchParams.get("source")

    const isImdbId = imdbIdParam && imdbIdParam.trim().startsWith("tt")

    if (!title && !imdbIdParam && !tmdbIdParam) {
      return Response.json({ error: "Title, IMDb ID, or TMDB ID is required" }, { status: 400 })
    }

    const omdbApiKey = process.env.OMDB_API_KEY
    const tmdbApiKey = process.env.TMDB_API_KEY

    if (!omdbApiKey && !tmdbApiKey) {
      return Response.json(
        { error: "OMDB_API_KEY or TMDB_API_KEY must be configured" },
        { status: 500 },
      )
    }

    const useOMDB = !source || source === "omdb"
    const useTMDB = !source || source === "tmdb"

    let omdbData: OMDBResponse | null = null
    let tmdbMovieData: TMDBMovieResponse | null = null
    let tmdbTVData: TMDBTVResponse | null = null
    let tmdbId: { movieId?: number; tvId?: number } | null = null
    const providerErrors: unknown[] = []

    if (useTMDB && tmdbApiKey) {
      try {
        if (tmdbIdParam) {
          const parsedId = parseInt(tmdbIdParam, 10)
          tmdbId = {
            movieId: type === "movie" ? parsedId : undefined,
            tvId: type === "series" ? parsedId : undefined,
          }
        } else if (isImdbId && imdbIdParam) {
          tmdbId = await findTMDBByIMDb(imdbIdParam.trim(), tmdbApiKey)
        } else if (title) {
          tmdbId = await searchTMDB(title, tmdbApiKey, type || undefined, year || undefined)
        }
      } catch (error) {
        providerErrors.push(error)
      }
    }

    if (useTMDB && tmdbApiKey && tmdbId) {
      try {
        if (tmdbId.movieId) {
          tmdbMovieData = await fetchTMDBMovie(tmdbId.movieId, tmdbApiKey)
        } else if (tmdbId.tvId) {
          tmdbTVData = await fetchTMDBTV(tmdbId.tvId, tmdbApiKey)
        }
      } catch (error) {
        providerErrors.push(error)
      }
    }

    if (useOMDB && omdbApiKey) {
      try {
        if (isImdbId && imdbIdParam) {
          omdbData = await fetchOMDBByIMDbId(imdbIdParam.trim(), omdbApiKey)
        } else if (title) {
          const options = {
            type: type === "movie" || type === "series" ? type : undefined,
            year: year || undefined,
          }

          omdbData = await fetchOMDBByTitle(title, omdbApiKey, options)

          if ((!omdbData || omdbData.Response === "False") && !isImdbId) {
            const searchResults = await searchOMDB(title, omdbApiKey, options.type)
            if (searchResults.length > 0) {
              const bestMatch = findBestOMDBMatch(title, searchResults, options.type)
              if (bestMatch) {
                omdbData = await fetchOMDBByTitle(bestMatch.Title, omdbApiKey, options)
              }
            }
          }
        }
      } catch (error) {
        providerErrors.push(error)
      }
    }

    const hasOMDBData = omdbData && omdbData.Response === "True"
    const hasTMDBData = tmdbMovieData !== null || tmdbTVData !== null

    if (!hasOMDBData && !hasTMDBData) {
      if (providerErrors.length > 0) {
        const error = providerErrors[0]
        return Response.json(
          getProviderErrorPayload(error, "Failed to fetch metadata"),
          { status: getErrorStatus(error) },
        )
      }

      return Response.json({ error: "Media not found" }, { status: 404 })
    }

    const data = hasOMDBData ? omdbData : null
    const isTVShow =
      data?.Type?.toLowerCase() === "series" ||
      data?.Type?.toLowerCase() === "episode" ||
      tmdbTVData !== null

    let episodeCount: number | null = null
    let seasonInfo: string | null = null
    let totalRuntime: string | null = null
    let seasonEpisodes: number | null = null
    let seasonNumber: string | null = null
    let seasonTotalLength: string | null = null

    if (isTVShow) {
      if (tmdbTVData) {
        episodeCount = tmdbTVData.number_of_episodes || null
        if (tmdbTVData.number_of_seasons) {
          seasonInfo =
            tmdbTVData.number_of_seasons === 1
              ? "1 season"
              : `${tmdbTVData.number_of_seasons} seasons`
        }

        if (episodeCount && tmdbTVData.episode_run_time?.length) {
          const avgEpisodeRuntime =
            tmdbTVData.episode_run_time[0] ||
            Math.round(
              tmdbTVData.episode_run_time.reduce((total, value) => total + value, 0) /
                tmdbTVData.episode_run_time.length,
            )
          totalRuntime = formatRuntime(episodeCount * avgEpisodeRuntime)
        }
      } else if (data?.totalSeasons) {
        const seasons = parseInt(data.totalSeasons)
        seasonInfo = seasons === 1 ? "1 season" : `${seasons} seasons`
      }

      if (season) {
        const seasonMatch = season.match(/\d+/)
        const seasonNum = seasonMatch ? seasonMatch[0] : season
        seasonNumber = `Season ${seasonNum}`

        if (tmdbTVData?.seasons) {
          const seasonData = tmdbTVData.seasons.find(
            (entry) => entry.season_number === parseInt(seasonNum),
          )

          if (seasonData) {
            seasonEpisodes = seasonData.episode_count
            if (seasonEpisodes && tmdbTVData.episode_run_time?.length) {
              const avgEpisodeRuntime =
                tmdbTVData.episode_run_time[0] ||
                Math.round(
                  tmdbTVData.episode_run_time.reduce((total, value) => total + value, 0) /
                    tmdbTVData.episode_run_time.length,
                )
              seasonTotalLength = formatRuntime(seasonEpisodes * avgEpisodeRuntime)
            }
          }
        }
      }
    }

    const metadata: Record<string, any> = {
      title: null,
      poster_url: null,
      genre: null,
      language: null,
      average_rating: null,
      length: null,
      type: null,
      episodes: null,
      season: null,
      year: null,
      plot: null,
      imdb_id: null,
    }

    if (tmdbMovieData) {
      metadata.title = tmdbMovieData.title
      metadata.year = tmdbMovieData.release_date?.substring(0, 4) || null
      metadata.plot = tmdbMovieData.overview || null
      metadata.average_rating = tmdbMovieData.vote_average
        ? parseFloat(tmdbMovieData.vote_average.toFixed(1))
        : null
      metadata.genre = tmdbMovieData.genres?.map((genre) => genre.name) || null
      metadata.language = tmdbMovieData.spoken_languages?.length
        ? normalizeLanguage(tmdbMovieData.spoken_languages.map((language) => language.name || language.iso_639_1 || "")).join(", ")
        : null
      metadata.imdb_id = tmdbMovieData.imdb_id || null
      metadata.length = tmdbMovieData.runtime ? formatRuntime(tmdbMovieData.runtime) : null
      metadata.type = "Movie"
      metadata.poster_url = getTMDBPosterUrl(tmdbMovieData.poster_path)
    } else if (tmdbTVData) {
      metadata.title = tmdbTVData.name
      metadata.year = tmdbTVData.first_air_date?.substring(0, 4) || null
      metadata.plot = tmdbTVData.overview || null
      metadata.average_rating = tmdbTVData.vote_average
        ? parseFloat(tmdbTVData.vote_average.toFixed(1))
        : null
      metadata.genre = tmdbTVData.genres?.map((genre) => genre.name) || null
      metadata.language = tmdbTVData.spoken_languages?.length
        ? normalizeLanguage(tmdbTVData.spoken_languages.map((language) => language.name || language.iso_639_1 || "")).join(", ")
        : null
      metadata.imdb_id = tmdbTVData.external_ids?.imdb_id || null
      metadata.type = "TV Show"
      metadata.episodes = seasonEpisodes !== null ? seasonEpisodes : episodeCount
      metadata.season = seasonNumber || seasonInfo
      metadata.length = seasonTotalLength || totalRuntime
      metadata.poster_url = getTMDBPosterUrl(tmdbTVData.poster_path)
    } else if (data) {
      metadata.title = data.Title || null
      metadata.year = data.Year || null
      metadata.plot = data.Plot || null
      metadata.average_rating =
        data.imdbRating && data.imdbRating !== "N/A" ? parseFloat(data.imdbRating) : null
      metadata.genre = data.Genre && data.Genre !== "N/A" ? data.Genre : null
      metadata.language =
        data.Language && data.Language !== "N/A"
          ? normalizeLanguage(data.Language).join(", ")
          : null
      metadata.imdb_id = data.imdbID && data.imdbID !== "N/A" ? data.imdbID : null
      metadata.type = mapOMDBType(data.Type)
      metadata.poster_url = data.Poster && data.Poster !== "N/A" ? data.Poster : null

      if (isTVShow) {
        metadata.episodes = seasonEpisodes !== null ? seasonEpisodes : episodeCount
        metadata.season = seasonNumber || seasonInfo
        metadata.length =
          seasonTotalLength || totalRuntime || (data.Runtime && data.Runtime !== "N/A" ? data.Runtime : null)
      } else {
        metadata.length = data.Runtime && data.Runtime !== "N/A" ? data.Runtime : null
      }
    }

    return Response.json({ metadata })
  } catch (error) {
    console.error("Expo metadata route error:", error)
    return Response.json({ error: "Failed to fetch metadata" }, { status: 500 })
  }
}
