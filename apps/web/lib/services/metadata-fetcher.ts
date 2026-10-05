import {
  fetchTMDBMovie,
  fetchTMDBTV,
  searchTMDB,
  findTMDBByIMDb,
  formatRuntime,
  getTMDBPosterUrl,
  TMDBMovieResponse,
  TMDBTVResponse
} from "@/lib/services/tmdb";
import {
  fetchOMDBByTitle,
  fetchOMDBByIMDbId,
  searchOMDB,
  findBestOMDBMatch,
  mapOMDBType,
  OMDBResponse
} from "@/lib/services/omdb";
import { normalizeLanguage } from "@/lib/language-utils";
import { classifyWithGemini } from "@/lib/services/ai-classifier";

export interface MetadataOptions {
  title?: string | null;
  imdb_id?: string | null;
  type?: string | null;
  medium?: string | null;
  year?: string | null;
  season?: string | null;
  source?: string | null;
}

export async function getMetadata(options: MetadataOptions) {
  const { title, imdb_id, type, medium, year, season, source } = options;

  const isImdbId = imdb_id && imdb_id.trim().startsWith("tt");

  if (!title && !imdb_id) {
    throw new Error("Title or IMDb ID is required");
  }

  const omdbApiKey = process.env.OMDB_API_KEY;
  const tmdbApiKey = process.env.TMDB_API_KEY;

  if (!omdbApiKey && !tmdbApiKey) {
    throw new Error("OMDB_API_KEY or TMDB_API_KEY must be configured");
  }

  const useOMDB = !source || source === "omdb";
  const useTMDB = !source || source === "tmdb";

  let omdbData: OMDBResponse | null = null;
  let tmdbMovieData: TMDBMovieResponse | null = null;
  let tmdbTVData: TMDBTVResponse | null = null;
  let tmdbId: { movieId?: number; tvId?: number } | null = null;

  // Step 1: Find TMDB ID (if using TMDB)
  if (useTMDB && tmdbApiKey) {
    if (isImdbId && imdb_id) {
      tmdbId = await findTMDBByIMDb(imdb_id.trim(), tmdbApiKey);
    } else if (title) {
      tmdbId = await searchTMDB(title, tmdbApiKey, type || undefined, year || undefined);
    }
  }

  // Step 2: Fetch from TMDB if we have an ID
  if (useTMDB && tmdbApiKey && tmdbId) {
    if (tmdbId.movieId) {
      tmdbMovieData = await fetchTMDBMovie(tmdbId.movieId, tmdbApiKey);
    } else if (tmdbId.tvId) {
      tmdbTVData = await fetchTMDBTV(tmdbId.tvId, tmdbApiKey);
    }
  }

  // Step 3: Fetch from OMDB (if using OMDB)
  if (useOMDB && omdbApiKey) {
    if (isImdbId && imdb_id) {
      omdbData = await fetchOMDBByIMDbId(imdb_id.trim(), omdbApiKey);
    } else if (title) {
      const omdbOptions = {
        type: (type === "movie" || type === "series") ? type : undefined,
        year: year || undefined
      };
      omdbData = await fetchOMDBByTitle(title, omdbApiKey, omdbOptions);

      // If direct title search fails, try fuzzy search
      if ((!omdbData || omdbData.Response === "False") && !isImdbId) {
        const searchResults = await searchOMDB(title, omdbApiKey, omdbOptions.type);
        if (searchResults.length > 0) {
          const bestMatch = findBestOMDBMatch(title, searchResults, omdbOptions.type);
          if (bestMatch) {
            omdbData = await fetchOMDBByTitle(bestMatch.Title, omdbApiKey, omdbOptions);
          }
        }
      }
    } else {
      if (!tmdbMovieData && !tmdbTVData) {
        throw new Error("Title or IMDb ID is required");
      }
    }
  }

  const hasOMDBData = omdbData && omdbData.Response === "True";
  const hasTMDBData = tmdbMovieData !== null || tmdbTVData !== null;

  if (!hasOMDBData && !hasTMDBData) {
    throw new Error("Media not found");
  }

  const data = hasOMDBData ? omdbData : null;
  const isTVShow = (data?.Type?.toLowerCase() === "series" || data?.Type?.toLowerCase() === "episode") || tmdbTVData !== null;

  let episodeCount: number | null = null;
  let seasonInfo: string | null = null;
  let totalRuntime: string | null = null;
  let seasonEpisodes: number | null = null;
  let seasonNumber: string | null = null;
  let seasonTotalLength: string | null = null;

  if (isTVShow) {
    if (tmdbTVData) {
      episodeCount = tmdbTVData.number_of_episodes || null;
      if (tmdbTVData.number_of_seasons) {
        seasonInfo = tmdbTVData.number_of_seasons === 1 ? "1 season" : `${tmdbTVData.number_of_seasons} seasons`;
      }
      if (episodeCount && tmdbTVData.episode_run_time && tmdbTVData.episode_run_time.length > 0) {
        const avgEpisodeRuntime = tmdbTVData.episode_run_time[0] ||
          Math.round(tmdbTVData.episode_run_time.reduce((a, b) => a + b, 0) / tmdbTVData.episode_run_time.length);
        totalRuntime = formatRuntime(episodeCount * avgEpisodeRuntime);
      }
    } else if (data && data.totalSeasons) {
      const seasons = parseInt(data.totalSeasons);
      seasonInfo = seasons === 1 ? "1 season" : `${seasons} seasons`;
    }

    if (season) {
      const seasonMatch = season.match(/\d+/);
      const seasonNum = seasonMatch ? seasonMatch[0] : season;
      seasonNumber = `Season ${seasonNum}`;

      if (tmdbTVData && tmdbTVData.seasons) {
        const seasonData = tmdbTVData.seasons.find(s => s.season_number === parseInt(seasonNum));
        if (seasonData) {
          seasonEpisodes = seasonData.episode_count;
          if (seasonEpisodes && tmdbTVData.episode_run_time && tmdbTVData.episode_run_time.length > 0) {
            const avgEpisodeRuntime = tmdbTVData.episode_run_time[0] ||
              Math.round(tmdbTVData.episode_run_time.reduce((a, b) => a + b, 0) / tmdbTVData.episode_run_time.length);
            seasonTotalLength = formatRuntime(seasonEpisodes * avgEpisodeRuntime);
          }
        }
      }
    }
  }

  const metadata: any = {
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
  };

  if (tmdbMovieData) {
    metadata.title = tmdbMovieData.title;
    metadata.year = tmdbMovieData.release_date?.substring(0, 4) || null;
    metadata.plot = tmdbMovieData.overview || null;
    metadata.average_rating = tmdbMovieData.vote_average ? parseFloat((tmdbMovieData.vote_average).toFixed(1)) : null;
    metadata.genre = tmdbMovieData.genres?.map(g => g.name) || null;
    metadata.language = tmdbMovieData.spoken_languages?.length
      ? normalizeLanguage(tmdbMovieData.spoken_languages.map((l) => l.name || l.iso_639_1 || "")).join(", ")
      : null;
    metadata.imdb_id = tmdbMovieData.imdb_id || null;
    metadata.length = tmdbMovieData.runtime ? formatRuntime(tmdbMovieData.runtime) : null;
    metadata.type = "Movie";
    metadata.poster_url = getTMDBPosterUrl(tmdbMovieData.poster_path);
  } else if (tmdbTVData) {
    metadata.title = tmdbTVData.name;
    metadata.year = tmdbTVData.first_air_date?.substring(0, 4) || null;
    metadata.plot = tmdbTVData.overview || null;
    metadata.average_rating = tmdbTVData.vote_average ? parseFloat((tmdbTVData.vote_average).toFixed(1)) : null;
    metadata.genre = tmdbTVData.genres?.map(g => g.name) || null;
    metadata.language = tmdbTVData.spoken_languages?.length
      ? normalizeLanguage(tmdbTVData.spoken_languages.map((l) => l.name || l.iso_639_1 || "")).join(", ")
      : null;
    metadata.imdb_id = tmdbTVData.external_ids?.imdb_id || null;
    metadata.type = "TV Show";
    metadata.episodes = seasonEpisodes !== null ? seasonEpisodes : episodeCount;
    metadata.season = seasonNumber || seasonInfo;
    metadata.length = seasonTotalLength || totalRuntime;
    metadata.poster_url = getTMDBPosterUrl(tmdbTVData.poster_path);
  } else if (data) {
    metadata.title = data.Title || null;
    metadata.year = data.Year || null;
    metadata.plot = data.Plot || null;
    metadata.average_rating = data.imdbRating && data.imdbRating !== "N/A" ? parseFloat(data.imdbRating) : null;
    metadata.genre = data.Genre && data.Genre !== "N/A" ? data.Genre : null;
    metadata.language =
      data.Language && data.Language !== "N/A"
        ? normalizeLanguage(data.Language).join(", ")
        : null;
    metadata.imdb_id = data.imdbID && data.imdbID !== "N/A" ? data.imdbID : null;
    metadata.type = mapOMDBType(data.Type);
    metadata.poster_url = data.Poster && data.Poster !== "N/A" ? data.Poster : null;

    if (isTVShow) {
      metadata.episodes = seasonEpisodes !== null ? seasonEpisodes : episodeCount;
      metadata.season = seasonNumber || seasonInfo;
      metadata.length = seasonTotalLength || totalRuntime || (data.Runtime && data.Runtime !== "N/A" ? data.Runtime : null);
    } else {
      metadata.length = data.Runtime && data.Runtime !== "N/A" ? data.Runtime : null;
    }
  }

  if (data) {
    if (data.imdbRating && data.imdbRating !== "N/A") {
      const omdbRating = parseFloat(data.imdbRating);
      if (!metadata.average_rating || omdbRating > 0) {
        metadata.average_rating = omdbRating;
      }
    }
    if (data.Poster && data.Poster !== "N/A" && !metadata.poster_url) {
      metadata.poster_url = data.Poster;
    }
    if (data.Genre && data.Genre !== "N/A") {
      if (!metadata.genre) {
        metadata.genre = data.Genre;
      } else if (Array.isArray(metadata.genre)) {
        const omdbGenres = data.Genre.split(",").map((g: string) => g.trim());
        const merged = [...new Set([...metadata.genre, ...omdbGenres])];
        metadata.genre = merged;
      }
    }
  }

  let needsAIClassification = false;
  if (metadata.genre) {
    const genres = Array.isArray(metadata.genre) ? metadata.genre : metadata.genre.split(",").map((g: string) => g.trim());
    const genresLower = genres.map((g: string) => g.toLowerCase());
    
    if (genresLower.includes("documentary")) {
      metadata.content_type = "Documentary";
    } else if (genresLower.includes("animation") || genresLower.includes("anime")) {
      metadata.content_type = "Animation";
    } else if (genresLower.includes("reality") || genresLower.includes("game-show")) {
      metadata.content_type = "Reality";
    } else if (genresLower.includes("talk-show") || genresLower.includes("variety") || genresLower.includes("news")) {
      metadata.content_type = "Variety";
    } else {
      metadata.content_type = "Scripted Live Action";
    }
  } else {
    needsAIClassification = true;
  }

  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (needsAIClassification && geminiApiKey && metadata.title) {
    try {
      const classification = await classifyWithGemini({
        title: metadata.title,
        plot: metadata.plot || undefined,
        genres: Array.isArray(metadata.genre) ? metadata.genre : (metadata.genre ? [metadata.genre] : undefined),
        year: metadata.year || undefined,
        type: metadata.type || undefined,
      }, geminiApiKey);

      if (classification) {
        if (classification.content_type && !metadata.content_type) {
          metadata.content_type = classification.content_type;
        }
        if (classification.medium && !metadata.type) {
          metadata.type = classification.medium;
        }
        if (classification.suggested_genres && (!metadata.genre || (Array.isArray(metadata.genre) && metadata.genre.length === 0))) {
          metadata.genre = classification.suggested_genres;
        }
      }
    } catch (error) {
      console.error("AI classification failed, continuing without it:", error);
    }
  }

  if (!metadata.content_type) {
    metadata.content_type = "Scripted Live Action";
  }

  if (metadata.type === "Movie" && !metadata.season) {
    metadata.season = "1";
  } else if (metadata.type === "TV Show" && !metadata.season) {
    metadata.season = "Season 1";
  }

  if (metadata.type === "Movie" && !metadata.episodes) {
    metadata.episodes = 1;
  }

  metadata.price = 0;

  return metadata;
}
