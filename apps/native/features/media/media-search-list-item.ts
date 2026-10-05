import type { MediaEntrySearchResult } from "@analytics/domain"

import type { MediaSearchListItem, MetadataSearchResult, MetadataSearchSource } from "@/features/media/media-types"

function formatMetadataKindLabel(mediaType: MetadataSearchResult["media_type"]) {
  return mediaType === "tv" ? "TV Show" : "Movie"
}

export function getMetadataSearchSourceLabel(source: MetadataSearchSource) {
  return source === "tmdb" ? "From TMDB" : "From OMDb"
}

export function createMediaSearchListItemFromEntryResult(
  result: MediaEntrySearchResult,
): MediaSearchListItem {
  const entry = result.entry
  const subtitle = [entry.medium, entry.type, entry.platform].filter(Boolean).join(" • ")

  return {
    detailLabel: result.matchKind === "secondary-field" ? `Matched ${result.matchedField}` : "Title match",
    id: entry.id,
    kind: "local",
    localEntryId: entry.id,
    posterType: entry.type ?? null,
    posterUrl: entry.poster_url ?? null,
    primaryLabel: entry.status ?? "Uncategorized",
    subtitle: subtitle || null,
    title: entry.title ?? "Untitled",
  }
}

export function createMediaSearchListItemFromMetadataResult(
  result: MetadataSearchResult,
): MediaSearchListItem {
  const subtitle = [result.year, formatMetadataKindLabel(result.media_type)].filter(Boolean).join(" • ")

  return {
    detailLabel: getMetadataSearchSourceLabel(result.source),
    id: result.id,
    kind: "external",
    posterType: formatMetadataKindLabel(result.media_type),
    posterUrl: result.poster_url,
    prefillImdbId: result.imdb_id,
    prefillMediaType: result.media_type,
    primaryLabel: "API result",
    subtitle: subtitle || null,
    title: result.title,
  }
}
