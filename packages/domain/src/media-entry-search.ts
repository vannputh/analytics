import type { MediaEntry } from "./database.types"
import type { FilterState } from "./filter-types"
import { applyFilters } from "./filter-types"

const WATCHING_STATUSES = new Set(["watching", "watching"])
const FINISHED_STATUS = "watched"

export type MediaSearchScope = "filtered" | "all"
export type MediaEntrySearchMatchKind = "title-prefix" | "title-substring" | "secondary-field"
export type MediaEntrySearchField =
  | "title"
  | "status"
  | "medium"
  | "type"
  | "platform"
  | "genre"
  | "language"
  | "season"

export interface MediaEntrySearchResult {
  entry: MediaEntry
  matchKind: MediaEntrySearchMatchKind
  matchedField: MediaEntrySearchField
}

interface SearchMediaEntriesOptions {
  filters?: FilterState
  query: string
  scope?: MediaSearchScope
}

function normalizeValue(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? ""
}

function toTimestamp(value: string | null | undefined) {
  if (!value) {
    return 0
  }

  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? 0 : timestamp
}

function getMediaEntryRecencyTimestamp(entry: MediaEntry) {
  if (entry.status && WATCHING_STATUSES.has(entry.status)) {
    return Math.max(toTimestamp(entry.last_watched_at), toTimestamp(entry.updated_at), toTimestamp(entry.created_at))
  }

  if (entry.status === FINISHED_STATUS) {
    return Math.max(toTimestamp(entry.finish_date), toTimestamp(entry.updated_at), toTimestamp(entry.created_at))
  }

  return Math.max(toTimestamp(entry.start_date), toTimestamp(entry.updated_at), toTimestamp(entry.created_at))
}

function getSecondaryFieldMatch(entry: MediaEntry, query: string): MediaEntrySearchField | null {
  if (normalizeValue(entry.status).includes(query)) return "status"
  if (normalizeValue(entry.medium).includes(query)) return "medium"
  if (normalizeValue(entry.type).includes(query)) return "type"
  if (normalizeValue(entry.platform).includes(query)) return "platform"
  if (Array.isArray(entry.genre) && entry.genre.some((genre) => normalizeValue(genre).includes(query))) return "genre"
  if (
    Array.isArray(entry.language) &&
    entry.language.some((language) => normalizeValue(language).includes(query))
  ) {
    return "language"
  }
  if (normalizeValue(entry.season).includes(query)) return "season"
  return null
}

function compareSearchResults(left: MediaEntrySearchResult, right: MediaEntrySearchResult) {
  const matchKindOrder: Record<MediaEntrySearchMatchKind, number> = {
    "title-prefix": 0,
    "title-substring": 1,
    "secondary-field": 2,
  }

  const matchComparison = matchKindOrder[left.matchKind] - matchKindOrder[right.matchKind]
  if (matchComparison !== 0) {
    return matchComparison
  }

  const recencyComparison =
    getMediaEntryRecencyTimestamp(right.entry) - getMediaEntryRecencyTimestamp(left.entry)
  if (recencyComparison !== 0) {
    return recencyComparison
  }

  return (left.entry.title ?? "").localeCompare(right.entry.title ?? "")
}

export function normalizeMediaSearchQuery(query: string) {
  return query.trim().toLowerCase()
}

export function getMediaSearchSourceEntries(
  entries: MediaEntry[],
  filters: FilterState | undefined,
  scope: MediaSearchScope = "filtered",
) {
  if (scope === "all" || !filters) {
    return entries
  }

  return applyFilters(entries, filters)
}

export function searchMediaEntries(
  entries: MediaEntry[],
  { filters, query, scope = "filtered" }: SearchMediaEntriesOptions,
): MediaEntrySearchResult[] {
  const normalizedQuery = normalizeMediaSearchQuery(query)

  if (!normalizedQuery) {
    return []
  }

  const results: MediaEntrySearchResult[] = []

  for (const entry of getMediaSearchSourceEntries(entries, filters, scope)) {
    const normalizedTitle = normalizeValue(entry.title)

    if (normalizedTitle.startsWith(normalizedQuery)) {
      results.push({
        entry,
        matchKind: "title-prefix",
        matchedField: "title",
      })
      continue
    }

    if (normalizedTitle.includes(normalizedQuery)) {
      results.push({
        entry,
        matchKind: "title-substring",
        matchedField: "title",
      })
      continue
    }

    const matchedField = getSecondaryFieldMatch(entry, normalizedQuery)
    if (!matchedField) {
      continue
    }

    results.push({
      entry,
      matchKind: "secondary-field",
      matchedField,
    })
  }

  return results.sort(compareSearchResults)
}
