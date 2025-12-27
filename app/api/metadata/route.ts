import { NextRequest, NextResponse } from "next/server";

// OMDB API (free tier: 1000 requests/day)
// You can also use TMDB API - both are popular choices
// For OMDB: Get free API key from http://www.omdbapi.com/apikey.aspx
// For TMDB: Get free API key from https://www.themoviedb.org/settings/api

interface OMDBResponse {
  Title?: string;
  Year?: string;
  Type?: string;
  Poster?: string;
  imdbRating?: string;
  imdbID?: string;
  Genre?: string;
  Runtime?: string;
  totalSeasons?: string;
  Season?: string;
  Episodes?: Array<{
    Title: string;
    Released: string;
    Episode: string;
    imdbRating: string;
    imdbID: string;
  }>;
  Plot?: string;
  Language?: string;
  Response: string;
  Error?: string;
}

interface OMDBSearchResponse {
  Search?: Array<{
    Title: string;
    Year: string;
    imdbID: string;
    Type: string;
    Poster: string;
  }>;
  totalResults?: string;
  Response: string;
  Error?: string;
}

interface OMDBEpisodeResponse {
  Runtime?: string;
  Response: string;
  Error?: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const title = searchParams.get("title");
    const type = searchParams.get("type"); // movie, series, episode
    const year = searchParams.get("year");
    const season = searchParams.get("season"); // Season number (e.g., "1", "2")

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // You need to set OMDB_API_KEY in your .env file
    // Get your free key from: http://www.omdbapi.com/apikey.aspx
    const apiKey = process.env.OMDB_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "OMDB_API_KEY not configured",
          info: "Get a free API key from http://www.omdbapi.com/apikey.aspx and add it to your .env file",
        },
        { status: 500 }
      );
    }

    // First, try direct title search
    let params = new URLSearchParams({
      apikey: apiKey,
      t: title,
      plot: "short",
    });

    if (type && (type === "movie" || type === "series")) {
      params.append("type", type);
    }

    if (year) {
      params.append("y", year);
    }

    let omdbUrl = `https://www.omdbapi.com/?${params.toString()}`;
    let response = await fetch(omdbUrl);
    let data: OMDBResponse = await response.json();

    // If direct search fails, try fuzzy search
    if (data.Response === "False") {
      // Use search endpoint to find matches
      const searchParams = new URLSearchParams({
        apikey: apiKey,
        s: title,
      });

      if (type && (type === "movie" || type === "series")) {
        searchParams.append("type", type);
      }

      const searchUrl = `https://www.omdbapi.com/?${searchParams.toString()}`;
      const searchResponse = await fetch(searchUrl);
      const searchData: OMDBSearchResponse = await searchResponse.json();

      if (searchData.Response === "True" && searchData.Search && searchData.Search.length > 0) {
        // Find the best match
        const bestMatch = findBestMatch(title, searchData.Search, type);
        
        if (bestMatch) {
          // Fetch full details using the matched title
          params = new URLSearchParams({
            apikey: apiKey,
            t: bestMatch.Title,
            plot: "short",
          });

          if (type && (type === "movie" || type === "series")) {
            params.append("type", type);
          }

          if (year) {
            params.append("y", year);
          }

          omdbUrl = `https://www.omdbapi.com/?${params.toString()}`;
          response = await fetch(omdbUrl);
          data = await response.json();

          if (data.Response === "False") {
            return NextResponse.json(
              { error: data.Error || "Media not found" },
              { status: 404 }
            );
          }
        } else {
          return NextResponse.json(
            { error: "Media not found" },
            { status: 404 }
          );
        }
      } else {
        return NextResponse.json(
          { error: data.Error || "Media not found" },
          { status: 404 }
        );
      }
    }

    // If season is specified, fetch season-specific data
    let seasonEpisodes = null;
    let seasonNumber = null;
    let seasonTotalLength = null;
    
    if (season && data.Type?.toLowerCase() === "series") {
      // Extract season number from "Season 1" or just "1"
      const seasonMatch = season.match(/\d+/);
      const seasonNum = seasonMatch ? seasonMatch[0] : season;
      
      const seasonParams = new URLSearchParams({
        apikey: apiKey,
        t: title,
        Season: seasonNum,
      });

      try {
        const seasonUrl = `https://www.omdbapi.com/?${seasonParams.toString()}`;
        const seasonResponse = await fetch(seasonUrl);
        const seasonData: OMDBResponse = await seasonResponse.json();

        if (seasonData.Response === "True" && seasonData.Episodes) {
          seasonEpisodes = seasonData.Episodes.length;
          seasonNumber = `Season ${seasonNum}`;
          
          // Fetch runtime for each episode to calculate total length
          let totalMinutes = 0;
          const episodePromises = seasonData.Episodes.map(async (episode) => {
            try {
              const episodeParams = new URLSearchParams({
                apikey: apiKey,
                i: episode.imdbID,
              });
              const episodeUrl = `https://www.omdbapi.com/?${episodeParams.toString()}`;
              const episodeResponse = await fetch(episodeUrl);
              const episodeData: OMDBEpisodeResponse = await episodeResponse.json();
              
              if (episodeData.Response === "True" && episodeData.Runtime && episodeData.Runtime !== "N/A") {
                // Parse runtime (e.g., "60 min" or "60")
                const runtimeMatch = episodeData.Runtime.match(/(\d+)/);
                if (runtimeMatch) {
                  return parseInt(runtimeMatch[1]);
                }
              }
              return 0;
            } catch (err) {
              console.error(`Failed to fetch episode ${episode.imdbID}:`, err);
              return 0;
            }
          });
          
          // Wait for all episode requests with small delays to avoid rate limiting
          const runtimes = await Promise.all(
            episodePromises.map((promise, index) => 
              index === 0 ? promise : new Promise<number>(resolve => 
                setTimeout(() => promise.then(resolve), index * 100)
              )
            )
          );
          
          totalMinutes = runtimes.reduce((sum, minutes) => sum + minutes, 0);
          
          if (totalMinutes > 0) {
            // Format as "Xh Ym" or "X min"
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            if (hours > 0) {
              seasonTotalLength = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
            } else {
              seasonTotalLength = `${totalMinutes} min`;
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch season data:", err);
        // Continue without season data
      }
    }

    // Map OMDB data to our format
    const metadata = {
      title: data.Title,
      poster_url: data.Poster && data.Poster !== "N/A" ? data.Poster : null,
      genre: data.Genre && data.Genre !== "N/A" ? data.Genre : null,
      language: data.Language && data.Language !== "N/A" ? data.Language : null,
      average_rating: data.imdbRating && data.imdbRating !== "N/A" ? parseFloat(data.imdbRating) : null,
      length: seasonTotalLength || (data.Runtime && data.Runtime !== "N/A" ? data.Runtime : null),
      type: mapOMDBType(data.Type),
      episodes: seasonEpisodes !== null ? seasonEpisodes : (data.totalSeasons ? parseInt(data.totalSeasons) * 10 : null),
      season: seasonNumber || (data.totalSeasons ? `${data.totalSeasons} seasons` : null),
      year: data.Year,
      plot: data.Plot,
      imdb_id: data.imdbID && data.imdbID !== "N/A" ? data.imdbID : null,
    };

    return NextResponse.json(metadata);
  } catch (error) {
    console.error("Metadata fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch metadata" },
      { status: 500 }
    );
  }
}

function mapOMDBType(omdbType?: string): string | null {
  if (!omdbType) return null;
  
  const typeMap: Record<string, string> = {
    movie: "Movie",
    series: "TV Show",
    episode: "TV Show",
  };

  return typeMap[omdbType.toLowerCase()] || null;
}

function findBestMatch(
  searchQuery: string,
  results: Array<{ Title: string; Year: string; imdbID: string; Type: string; Poster: string }>,
  requestedType?: string | null
): { Title: string; Year: string; imdbID: string; Type: string; Poster: string } | null {
  if (results.length === 0) return null;

  const queryLower = searchQuery.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0);
  
  // Extract number from query (e.g., "2" from "doctor strange 2")
  const queryNumber = queryLower.match(/\b(\d+)\b/)?.[1];
  
  // Score each result
  const scoredResults = results.map(result => {
    let score = 0;
    const titleLower = result.Title.toLowerCase();
    const titleWords = titleLower.split(/\s+/).filter(w => w.length > 0);
    
    // Type match bonus
    if (requestedType) {
      const requestedTypeLower = requestedType.toLowerCase();
      const resultTypeLower = result.Type.toLowerCase();
      if (requestedTypeLower === resultTypeLower) {
        score += 100;
      }
    }
    
    // Exact title match (highest priority)
    if (titleLower === queryLower) {
      score += 1000;
    }
    
    // Check if query words appear in title
    let matchingWords = 0;
    queryWords.forEach(qWord => {
      if (titleWords.some(tWord => tWord.includes(qWord) || qWord.includes(tWord))) {
        matchingWords++;
      }
    });
    score += matchingWords * 50;
    
    // Number matching bonus (for sequels like "doctor strange 2")
    if (queryNumber) {
      const titleNumber = titleLower.match(/\b(\d+)\b/)?.[1];
      if (titleNumber === queryNumber) {
        score += 200;
      }
      
      // Also check for roman numerals or sequel indicators
      const sequelIndicators = ['ii', 'iii', 'iv', 'v', '2', '3', '4', '5'];
      const queryHasNumber = sequelIndicators.some(ind => queryLower.includes(ind));
      if (queryHasNumber) {
        // Check if title has sequel indicators
        const hasSequelInTitle = sequelIndicators.some(ind => titleLower.includes(ind));
        if (hasSequelInTitle) {
          score += 150;
        }
      }
    }
    
    // Check for common sequel words
    const sequelWords = ['multiverse', 'madness', 'sequel', 'returns', 'reborn', 'awakening'];
    if (queryLower.includes('2') || queryLower.includes('ii')) {
      sequelWords.forEach(word => {
        if (titleLower.includes(word)) {
          score += 100;
        }
      });
    }
    
    // Prefer more recent results (if year is close)
    const currentYear = new Date().getFullYear();
    const resultYear = parseInt(result.Year);
    if (!isNaN(resultYear)) {
      // Prefer results from the last 20 years
      if (resultYear >= currentYear - 20) {
        score += 10;
      }
    }
    
    return { result, score };
  });
  
  // Sort by score (highest first) and return the best match
  scoredResults.sort((a, b) => b.score - a.score);
  return scoredResults[0]?.result || null;
}

