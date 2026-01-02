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
