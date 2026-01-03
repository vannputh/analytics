export const MUSIC_TYPE_OPTIONS = [
    "Track",
    "Album",
    "EP",
    "Single",
    "Playlist",
    "Podcast",
    "Mix"
] as const;

export const MUSIC_STATUS_OPTIONS = [
    "Listening",
    "Finished", // For albums/playlists
    "On Repeat",
    "Dropped",
    "Plan to Listen"
] as const;

export const MUSIC_PLATFORM_OPTIONS = [
    "Spotify",
    "Apple Music",
    "YouTube Music",
    "SoundCloud",
    "Bandcamp",
    "Tidal",
    "Vinyl",
    "CD",
    "Other"
] as const;

export type MusicType = (typeof MUSIC_TYPE_OPTIONS)[number];
export type MusicStatus = (typeof MUSIC_STATUS_OPTIONS)[number];
export type MusicPlatform = (typeof MUSIC_PLATFORM_OPTIONS)[number];

export interface MusicFilterState {
    dateFrom: string | null;
    dateTo: string | null;
    genres: string[];
    types: string[];
    platforms: string[];
    statuses: string[];
    artists: string[];
}

export const defaultMusicFilterState: MusicFilterState = {
    dateFrom: null,
    dateTo: null,
    genres: [],
    types: [],
    platforms: [],
    statuses: [],
    artists: [],
};

import { MusicEntry } from "./database.types";

/**
 * Apply filters to a list of music entries
 */
export function applyMusicFilters(data: MusicEntry[], filters: MusicFilterState): MusicEntry[] {
    return data.filter((entry) => {
        // Date range filter (release_date or created_at based)
        if (filters.dateFrom) {
            const date = entry.release_date || entry.created_at
            if (!date || date < filters.dateFrom) return false
        }
        if (filters.dateTo) {
            const date = entry.release_date || entry.created_at
            if (!date || date > filters.dateTo) return false
        }

        // Genre filter (AND logic - entry must have ALL selected genres)
        if (filters.genres.length > 0) {
            if (!entry.genre || !Array.isArray(entry.genre)) return false
            const entryGenres = entry.genre.map((g) => g.toLowerCase().trim())
            for (const filterGenre of filters.genres) {
                if (!entryGenres.includes(filterGenre.toLowerCase().trim())) return false
            }
        }

        // Type filter
        if (filters.types.length > 0) {
            if (!entry.type || !filters.types.includes(entry.type)) return false
        }

        // Platform filter
        if (filters.platforms.length > 0) {
            if (!entry.platform || !filters.platforms.includes(entry.platform)) return false
        }

        // Status filter
        if (filters.statuses.length > 0) {
            if (!entry.status || !filters.statuses.includes(entry.status)) return false
        }

        // Artist filter
        if (filters.artists.length > 0) {
            if (!entry.artist || !filters.artists.includes(entry.artist)) return false
        }

        return true
    })
}

/**
 * Extract unique values from music data for filter options
 */
export function extractMusicFilterOptions(data: MusicEntry[]) {
    const genres = new Set<string>()
    const types = new Set<string>()
    const platforms = new Set<string>()
    const statuses = new Set<string>()
    const artists = new Set<string>()

    for (const entry of data) {
        if (entry.type) types.add(entry.type)
        if (entry.platform) platforms.add(entry.platform)
        if (entry.status) statuses.add(entry.status)
        if (entry.artist) artists.add(entry.artist)

        // Handle genre array
        if (entry.genre && Array.isArray(entry.genre)) {
            entry.genre.forEach((g) => {
                const trimmed = typeof g === 'string' ? g.trim() : String(g).trim()
                if (trimmed) genres.add(trimmed)
            })
        }
    }

    return {
        genres: Array.from(genres).sort(),
        types: Array.from(types).sort(),
        platforms: Array.from(platforms).sort(),
        statuses: Array.from(statuses).sort(),
        artists: Array.from(artists).sort(),
    }
}
