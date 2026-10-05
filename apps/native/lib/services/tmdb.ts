// TMDB API service module for movie and TV show metadata

import { fetchProviderJson } from "./provider-fetch";

export interface TMDBMovieResponse {
    id: number;
    title: string;
    release_date?: string;
    poster_path?: string;
    backdrop_path?: string;
    overview?: string;
    genres?: Array<{ id: number; name: string }>;
    runtime?: number;
    vote_average?: number;
    vote_count?: number;
    imdb_id?: string;
    spoken_languages?: Array<{ iso_639_1: string; name: string }>;
}

export interface TMDBTVResponse {
    id: number;
    name: string;
    first_air_date?: string;
    poster_path?: string;
    backdrop_path?: string;
    overview?: string;
    genres?: Array<{ id: number; name: string }>;
    episode_run_time?: number[];
    number_of_seasons?: number;
    number_of_episodes?: number;
    vote_average?: number;
    vote_count?: number;
    seasons?: Array<{
        id: number;
        name: string;
        season_number: number;
        episode_count: number;
        air_date?: string;
        overview?: string;
        poster_path?: string;
    }>;
    external_ids?: {
        imdb_id?: string;
    };
    spoken_languages?: Array<{ iso_639_1: string; name: string }>;
}

interface TMDBSearchResponse {
    results?: Array<{
        id: number;
        title?: string;
        name?: string;
        release_date?: string;
        first_air_date?: string;
        poster_path?: string;
        media_type: string;
    }>;
    total_results?: number;
}

interface TMDBFindResponse {
    movie_results?: Array<{ id: number }>;
    tv_results?: Array<{ id: number }>;
}

function tmdbHeaders(apiKey: string): Record<string, string> {
    return { Authorization: `Bearer ${apiKey}` };
}

export async function fetchTMDBMovie(tmdbId: number, apiKey: string): Promise<TMDBMovieResponse | null> {
    const url = `https://api.themoviedb.org/3/movie/${tmdbId}?append_to_response=external_ids`;
    return await fetchProviderJson<TMDBMovieResponse>(url, {
        headers: tmdbHeaders(apiKey),
        operation: `fetching movie ${tmdbId}`,
        provider: "tmdb",
    });
}

export async function fetchTMDBTV(tmdbId: number, apiKey: string): Promise<TMDBTVResponse | null> {
    const url = `https://api.themoviedb.org/3/tv/${tmdbId}?append_to_response=external_ids`;
    return await fetchProviderJson<TMDBTVResponse>(url, {
        headers: tmdbHeaders(apiKey),
        operation: `fetching TV show ${tmdbId}`,
        provider: "tmdb",
    });
}

export async function searchTMDB(
    title: string,
    apiKey: string,
    type?: string,
    year?: string
): Promise<{ movieId?: number; tvId?: number } | null> {
    const isTV = type === "series" || type === "tv";

    if (isTV) {
        const params = new URLSearchParams({ query: title });
        if (year) params.append("first_air_date_year", year);

        const url = `https://api.themoviedb.org/3/search/tv?${params.toString()}`;
        const data = await fetchProviderJson<TMDBSearchResponse>(url, {
            headers: tmdbHeaders(apiKey),
            operation: `searching TV metadata for "${title}"`,
            provider: "tmdb",
        });

        if (data.results && data.results.length > 0) {
            return { tvId: data.results[0].id };
        }
    } else {
        const params = new URLSearchParams({ query: title });
        if (year) params.append("year", year);

        const url = `https://api.themoviedb.org/3/search/movie?${params.toString()}`;
        const data = await fetchProviderJson<TMDBSearchResponse>(url, {
            headers: tmdbHeaders(apiKey),
            operation: `searching movie metadata for "${title}"`,
            provider: "tmdb",
        });

        if (data.results && data.results.length > 0) {
            return { movieId: data.results[0].id };
        }
    }

    return null;
}

export async function findTMDBByIMDb(imdbId: string, apiKey: string): Promise<{ movieId?: number; tvId?: number } | null> {
    const url = `https://api.themoviedb.org/3/find/${imdbId}?external_source=imdb_id`;
    const data = await fetchProviderJson<TMDBFindResponse>(url, {
        headers: tmdbHeaders(apiKey),
        operation: `looking up IMDb ID ${imdbId}`,
        provider: "tmdb",
    });

    if (data.movie_results && data.movie_results.length > 0) {
        return { movieId: data.movie_results[0].id };
    }
    if (data.tv_results && data.tv_results.length > 0) {
        return { tvId: data.tv_results[0].id };
    }

    return null;
}

export function formatRuntime(minutes: number): string {
    if (minutes < 60) {
        return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function getTMDBPosterUrl(posterPath: string | null | undefined): string | null {
    return posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : null;
}
