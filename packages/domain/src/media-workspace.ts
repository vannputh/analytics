import type { MediaEntry, MediaEntryInsert, MediaEntryUpdate, EpisodeWatchRecord } from "./database.types"
import type { CreateEntryInput } from "./media-entry-input"
import { normalizeLanguage } from "./language-utils"
import { calculateTimeTaken, MEDIUM_OPTIONS } from "./types"

export type MediaDraft = CreateEntryInput

export interface MediaFieldOptions {
  languages: string[]
  mediums: string[]
  platforms: string[]
  statuses: string[]
  types: string[]
}

export interface MediaMetadata {
  average_rating?: number | null
  episodes?: number | null
  genre?: string[] | string | null
  imdb_id?: string | null
  language?: string[] | string | null
  length?: string | null
  plot?: string | null
  poster_url?: string | null
  season?: string | null
  title?: string | null
  type?: string | null
  year?: string | null
}

export type MediaMetadataOverrideField =
  | "average_rating"
  | "episodes"
  | "genre"
  | "imdb_id"
  | "language"
  | "length"
  | "poster_url"
  | "season"
  | "title"
  | "type"

const DEFAULT_STATUS = "watching"
const FINISHED_STATUS = "watched"
const RESTARTABLE_STATUSES = new Set(["dropped", "on hold"])
const WATCHING_STATUSES = new Set(["watching", "watching"])
const OVERRIDE_FIELDS: MediaMetadataOverrideField[] = [
  "title",
  "poster_url",
  "genre",
  "language",
  "average_rating",
  "length",
  "episodes",
  "imdb_id",
  "season",
  "type",
]

function normalizeString(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function normalizeNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function normalizeGenre(value: string[] | string | null | undefined) {
  if (!value) {
    return null
  }

  const values = (Array.isArray(value) ? value : value.split(","))
    .map((item) => String(item).trim())
    .filter(Boolean)

  return values.length ? values : null
}

function hasMeaningfulValue(value: unknown) {
  if (value === null || value === undefined) {
    return false
  }

  if (typeof value === "string") {
    return value.trim().length > 0
  }

  if (Array.isArray(value)) {
    return value.length > 0
  }

  return true
}

function dedupe(values: string[]) {
  return Array.from(new Set(values))
}

export function createEmptyMediaDraft(today = new Date().toISOString().split("T")[0]): MediaDraft {
  return applyMediaDraftRules({
    title: "",
    status: DEFAULT_STATUS,
    medium: "Movie",
    episodes_watched: 0,
    start_date: today,
  })
}

export function createMediaDraftFromEntry(entry: MediaEntry): MediaDraft {
  return applyMediaDraftRules({
    title: entry.title,
    status: entry.status ?? DEFAULT_STATUS,
    episodes: entry.episodes ?? null,
    episodes_watched: entry.episodes_watched ?? 0,
    my_rating: entry.my_rating ?? null,
    poster_url: entry.poster_url ?? null,
    medium: entry.medium ?? null,
    type: entry.type ?? null,
    platform: entry.platform ?? null,
    season: entry.season ?? null,
    length: entry.length ?? null,
    language: entry.language ?? null,
    genre: entry.genre ?? null,
    imdb_id: entry.imdb_id ?? null,
    start_date: entry.start_date ?? null,
    finish_date: entry.finish_date ?? null,
    last_watched_at: entry.last_watched_at ?? null,
    time_taken: entry.time_taken ?? null,
    average_rating: entry.average_rating ?? null,
    price: entry.price ?? 0,
    episode_history: entry.episode_history ?? null,
  })
}

export function applyMediaDraftRules(draft: Partial<MediaDraft>): MediaDraft {
  const medium = normalizeString(draft.medium) ?? "Movie"
  const title = draft.title ?? ""
  const status = normalizeString(draft.status) ?? DEFAULT_STATUS
  const episodes =
    medium === "Movie"
      ? draft.episodes && draft.episodes > 0
        ? draft.episodes
        : 1
      : typeof draft.episodes === "number" && draft.episodes >= 0
        ? draft.episodes
        : null
  const finishDate = normalizeString(draft.finish_date)
  const nextStatus = finishDate ? FINISHED_STATUS : status
  const episodesWatched =
    nextStatus === FINISHED_STATUS && episodes
      ? episodes
      : typeof draft.episodes_watched === "number" && draft.episodes_watched >= 0
        ? draft.episodes_watched
        : 0
  const normalizedLanguages = draft.language ? normalizeLanguage(draft.language) : null
  const normalizedGenres = normalizeGenre(draft.genre)

  return {
    ...draft,
    title,
    status: nextStatus,
    medium,
    episodes,
    episodes_watched: episodesWatched,
    finish_date: finishDate,
    start_date: normalizeString(draft.start_date),
    last_watched_at: normalizeString(draft.last_watched_at),
    imdb_id: normalizeString(draft.imdb_id),
    platform: normalizeString(draft.platform),
    poster_url: normalizeString(draft.poster_url),
    season: normalizeString(draft.season),
    length: normalizeString(draft.length),
    type: normalizeString(draft.type),
    price: typeof draft.price === "number" && Number.isFinite(draft.price) ? draft.price : 0,
    my_rating: normalizeNumber(draft.my_rating),
    average_rating: normalizeNumber(draft.average_rating),
    language: normalizedLanguages?.length ? normalizedLanguages : null,
    genre: normalizedGenres,
    time_taken:
      normalizeString(draft.time_taken) ??
      calculateTimeTaken(normalizeString(draft.start_date), finishDate),
  }
}

export function buildMediaEntryPayload(
  draft: Partial<MediaDraft>,
): Omit<MediaEntryInsert, "user_id"> & { title: string } {
  const normalized = applyMediaDraftRules(draft)

  return {
    title: normalized.title.trim(),
    status: normalized.status ?? DEFAULT_STATUS,
    episodes: normalized.episodes ?? null,
    episodes_watched: normalized.episodes_watched ?? 0,
    my_rating: normalized.my_rating ?? null,
    poster_url: normalized.poster_url ?? null,
    medium: normalized.medium ?? null,
    type: normalized.type ?? null,
    platform: normalized.platform ?? null,
    season: normalized.season ?? null,
    length: normalized.length ?? null,
    language: normalized.language ?? null,
    genre: normalized.genre ?? null,
    imdb_id: normalized.imdb_id ?? null,
    start_date: normalized.start_date ?? null,
    finish_date: normalized.finish_date ?? null,
    last_watched_at: normalized.last_watched_at ?? null,
    time_taken: normalized.time_taken ?? null,
    price: normalized.price ?? 0,
    average_rating: normalized.average_rating ?? null,
    episode_history: normalized.episode_history ?? null,
  }
}

export function buildInitialEpisodeHistory(
  draft: Partial<MediaDraft>,
  today = new Date().toISOString(),
): {
  episode_history: MediaEntryInsert["episode_history"]
  episodes_watched: number
  last_watched_at: string
} | null {
  const normalized = applyMediaDraftRules(draft)
  const episodes = normalized.episodes ?? 0

  if (!episodes || !WATCHING_STATUSES.has(normalized.status ?? "")) {
    if (normalized.status !== FINISHED_STATUS || !episodes) {
      return null
    }
  }

  const isFinished = normalized.status === FINISHED_STATUS
  const episodesToCreate = isFinished ? episodes : 1
  const watchedAt = isFinished
    ? normalized.finish_date || today
    : normalized.start_date || today

  const history = Array.from({ length: episodesToCreate }, (_, index) => ({
    episode: index + 1,
    watched_at: watchedAt,
  }))

  return {
    episode_history: history as MediaEntryInsert["episode_history"],
    episodes_watched: episodesToCreate,
    last_watched_at: watchedAt,
  }
}

export function parseEpisodeHistory(value: unknown): EpisodeWatchRecord[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter(
      (item): item is EpisodeWatchRecord =>
        typeof item === "object" &&
        item !== null &&
        typeof item.episode === "number" &&
        typeof item.watched_at === "string",
    )
    .slice()
    .sort((left, right) => right.episode - left.episode)
}

export function addEpisodeHistoryRecord(
  history: EpisodeWatchRecord[],
  episode: number,
  watchedAt: string,
) {
  const nextHistory = history
    .filter((item) => item.episode !== episode)
    .concat({ episode, watched_at: watchedAt })
    .sort((left, right) => right.episode - left.episode)

  return buildEpisodeProgressUpdate(nextHistory, watchedAt)
}

export function updateEpisodeHistoryRecord(
  history: EpisodeWatchRecord[],
  index: number,
  watchedAt: string,
) {
  if (!history[index]) {
    return buildEpisodeProgressUpdate(history, null)
  }

  const nextHistory = history.map((item, itemIndex) =>
    itemIndex === index ? { ...item, watched_at: watchedAt } : item,
  )

  return buildEpisodeProgressUpdate(nextHistory, watchedAt)
}

export function deleteEpisodeHistoryRecord(history: EpisodeWatchRecord[], index: number) {
  const nextHistory = history.filter((_, itemIndex) => itemIndex !== index)
  const lastWatchedAt = nextHistory[0]?.watched_at ?? null

  return buildEpisodeProgressUpdate(nextHistory, lastWatchedAt)
}

export function buildEpisodeProgressUpdate(
  history: EpisodeWatchRecord[],
  lastWatchedAt: string | null,
  totalEpisodes?: number | null,
): MediaEntryUpdate {
  const normalizedHistory = history.slice().sort((left, right) => right.episode - left.episode)
  const maxEpisode = normalizedHistory.reduce(
    (current, record) => Math.max(current, record.episode),
    0,
  )
  const updates: Partial<MediaEntry> = {
    episode_history: normalizedHistory as unknown as MediaEntryUpdate["episode_history"],
    episodes_watched: maxEpisode,
    last_watched_at: lastWatchedAt,
  }

  if (totalEpisodes && maxEpisode >= totalEpisodes) {
    updates.status = FINISHED_STATUS
    updates.finish_date = new Date(lastWatchedAt ?? Date.now()).toISOString().split("T")[0]
  }

  return updates as MediaEntryUpdate
}

export function getMetadataOverrideFields(
  currentDraft: Partial<MediaDraft>,
  metadata: MediaMetadata,
) {
  const normalizedDraft = applyMediaDraftRules(currentDraft)
  const normalizedMetadata = normalizeMetadata(metadata)

  return OVERRIDE_FIELDS.filter((field) => {
    const currentValue = normalizedDraft[field]
    const nextValue = normalizedMetadata[field]

    if (!hasMeaningfulValue(nextValue) || !hasMeaningfulValue(currentValue)) {
      return false
    }

    return JSON.stringify(currentValue) !== JSON.stringify(nextValue)
  })
}

export function mergeMetadataIntoDraft(
  currentDraft: Partial<MediaDraft>,
  metadata: MediaMetadata,
  overrideFields: MediaMetadataOverrideField[] = [],
) {
  const normalizedDraft = applyMediaDraftRules(currentDraft)
  const normalizedMetadata = normalizeMetadata(metadata)

  const nextDraft: Partial<MediaDraft> = { ...normalizedDraft }

  for (const field of OVERRIDE_FIELDS) {
    const nextValue = normalizedMetadata[field]

    if (!hasMeaningfulValue(nextValue)) {
      continue
    }

    if (!hasMeaningfulValue(nextDraft[field]) || overrideFields.includes(field)) {
      ;(nextDraft as Record<string, unknown>)[field] = nextValue
    }
  }

  if (!normalizedDraft.medium && normalizedMetadata.type) {
    if (normalizedMetadata.type === "Movie") {
      nextDraft.medium = "Movie"
    }
    if (normalizedMetadata.type === "TV Show") {
      nextDraft.medium = "TV Show"
    }
  }

  return applyMediaDraftRules(nextDraft)
}

export function normalizeMetadata(metadata: MediaMetadata): MediaMetadata {
  return {
    title: normalizeString(metadata.title),
    poster_url: normalizeString(metadata.poster_url),
    genre: normalizeGenre(metadata.genre),
    language: metadata.language ? normalizeLanguage(metadata.language) : null,
    average_rating: normalizeNumber(metadata.average_rating),
    length: normalizeString(metadata.length),
    episodes:
      typeof metadata.episodes === "number" && metadata.episodes >= 0 ? metadata.episodes : null,
    imdb_id: normalizeString(metadata.imdb_id),
    plot: normalizeString(metadata.plot),
    season: normalizeString(metadata.season),
    type: normalizeString(metadata.type),
    year: normalizeString(metadata.year),
  }
}

export function buildRestartEntryPatch(
  entry: Pick<MediaEntry, "start_date" | "status">,
  today = new Date().toISOString().split("T")[0],
) {
  if (!entry.status || !RESTARTABLE_STATUSES.has(entry.status)) {
    return null
  }

  return {
    status: "watching",
    finish_date: null,
    start_date: entry.start_date || today,
  } as const
}

export function extractMediaFieldOptions(entries: MediaEntry[]): MediaFieldOptions {
  const options = {
    types: new Set<string>(),
    statuses: new Set<string>(),
    mediums: new Set<string>(MEDIUM_OPTIONS),
    platforms: new Set<string>(),
    languages: new Set<string>(),
  }

  for (const entry of entries) {
    if (entry.type) options.types.add(entry.type)
    if (entry.status) options.statuses.add(entry.status)
    if (entry.medium) options.mediums.add(entry.medium)
    if (entry.platform) options.platforms.add(entry.platform)

    normalizeLanguage(entry.language).forEach((language) => {
      options.languages.add(language)
    })
  }

  return {
    types: dedupe(Array.from(options.types)).sort(),
    statuses: dedupe(Array.from(options.statuses)).sort(),
    mediums: dedupe(Array.from(options.mediums)).sort(),
    platforms: dedupe(Array.from(options.platforms)).sort(),
    languages: dedupe(Array.from(options.languages)).sort(),
  }
}
