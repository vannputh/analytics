import type { MetadataSearchResult } from "@/features/media/media-types"

export interface MediaEditorAutocompleteState {
  error: string | null
  loading: boolean
  results: MetadataSearchResult[]
}

export interface MediaEditorAutocompleteSelection {
  params: Partial<Record<string, string>>
  source: MetadataSearchResult["source"]
}

export function createInitialMediaEditorAutocompleteState(): MediaEditorAutocompleteState {
  return {
    error: null,
    loading: false,
    results: [],
  }
}

export function shouldSearchMediaEditorAutocomplete(query: string) {
  return query.trim().length >= 2
}

export function startMediaEditorAutocompleteSearch(
  current: MediaEditorAutocompleteState,
): MediaEditorAutocompleteState {
  return {
    ...current,
    error: null,
    loading: true,
  }
}

export function succeedMediaEditorAutocompleteSearch(
  results: MetadataSearchResult[],
): MediaEditorAutocompleteState {
  return {
    error: null,
    loading: false,
    results,
  }
}

export function failMediaEditorAutocompleteSearch(
  message: string,
): MediaEditorAutocompleteState {
  return {
    error: message,
    loading: false,
    results: [],
  }
}

export function resolveMediaEditorAutocompleteSelection(
  result: MetadataSearchResult,
): MediaEditorAutocompleteSelection {
  const params: Partial<Record<string, string>> = {
    title: result.title,
    type: result.media_type === "tv" ? "series" : "movie",
  }

  if (result.imdb_id) {
    params.imdb_id = result.imdb_id
  }

  if (result.id.startsWith("tmdb_")) {
    const parts = result.id.split("_")
    if (parts.length >= 3) {
      params.tmdb_id = parts[parts.length - 1]
    }
  } else if (result.id.startsWith("omdb_") && !params.imdb_id) {
    params.imdb_id = result.id.replace("omdb_", "")
  }

  return {
    params,
    source: result.source,
  }
}

export function completeMediaEditorAutocompleteSelection() {
  return resetMediaEditorAutocompleteState()
}

export function resetMediaEditorAutocompleteState(): MediaEditorAutocompleteState {
  return createInitialMediaEditorAutocompleteState()
}
