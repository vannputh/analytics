import { useMemo } from "react"

import { useLocalSearchParams } from "expo-router"

import type { MediaDraft } from "@analytics/domain"

import { MediaEditorScreen } from "@/features/media/media-editor-screen"

export default function MediaAddRoute() {
  const params = useLocalSearchParams<{
    imdbId?: string | string[]
    mediaType?: "movie" | "tv" | Array<"movie" | "tv">
    title?: string | string[]
  }>()

  const initialDraft = useMemo<Partial<MediaDraft> | null>(() => {
    const title = Array.isArray(params.title) ? params.title[0] : params.title
    const mediaType = Array.isArray(params.mediaType) ? params.mediaType[0] : params.mediaType
    const imdbId = Array.isArray(params.imdbId) ? params.imdbId[0] : params.imdbId

    if (!title && !mediaType && !imdbId) {
      return null
    }

    return {
      imdb_id: imdbId ?? null,
      medium: mediaType === "tv" ? "TV Show" : mediaType === "movie" ? "Movie" : undefined,
      title: title ?? "",
    }
  }, [params.imdbId, params.mediaType, params.title])

  return <MediaEditorScreen mode="create" initialDraft={initialDraft} />
}
