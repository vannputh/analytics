import type { MediaEntryUpdate } from "@analytics/domain"

export type MediaDiaryArea = "watching" | "watched" | "planned" | "paused" | "dropped"
export type MetadataSearchSource = "tmdb" | "omdb"
export type MediaSearchListItemKind = "local" | "external"

export const MEDIA_DIARY_AREAS: MediaDiaryArea[] = ["watching", "watched", "planned", "paused", "dropped"]

export interface MetadataSearchResult {
  id: string
  imdb_id?: string
  media_type: "movie" | "tv"
  poster_url: string | null
  source: MetadataSearchSource
  title: string
  year: string | null
}

export interface MediaSearchListItem {
  detailLabel: string
  id: string
  kind: MediaSearchListItemKind
  localEntryId?: string
  posterUrl: string | null
  posterType: string | null
  primaryLabel: string
  prefillImdbId?: string
  prefillMediaType?: "movie" | "tv"
  subtitle: string | null
  title: string
}

export interface MediaDisplayPreferences {
  showAverageRating: boolean
  showDates: boolean
  showLanguage: boolean
  showMedium: boolean
  showPlatform: boolean
  showTimeTaken: boolean
  showType: boolean
}

export interface BatchEditFormState {
  appendGenres: string
  episodes: string
  language: string
  medium: string
  platform: string
  price: string
  status: string
  type: string
}

export type MediaBatchEditPayload = Partial<MediaEntryUpdate> & {
  appendGenres?: string[]
}

export const DEFAULT_MEDIA_DISPLAY_PREFERENCES: MediaDisplayPreferences = {
  showAverageRating: true,
  showDates: true,
  showLanguage: true,
  showMedium: true,
  showPlatform: true,
  showTimeTaken: true,
  showType: true,
}

export const DEFAULT_BATCH_EDIT_FORM_STATE: BatchEditFormState = {
  appendGenres: "",
  episodes: "",
  language: "",
  medium: "",
  platform: "",
  price: "",
  status: "",
  type: "",
}
