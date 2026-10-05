import { useEffect, useState } from "react"
import { ActivityIndicator, Text, View } from "react-native"

import { router } from "expo-router"

import { getPlaceholderPoster } from "@analytics/domain"

import { MediaButton } from "@/features/media/media-button"
import { useMediaDiary } from "@/features/media/media-diary-provider"
import { MediaPill } from "@/features/media/primitives/media-pill"
import { MediaScreenScrollView } from "@/features/media/primitives/media-screen-scroll-view"
import { MediaSurface } from "@/features/media/media-surface"
import {
  MEDIA_PRIMARY_TINT,
  MEDIA_PRIMARY_TINT_MUTED,
  MEDIA_SHEET_BACKGROUND,
} from "@/features/media/media-ui"

export function MediaWatchThisScreen() {
  const { fetchMetadata, setActiveWatchThisEntryId, watchThisEntry } = useMediaDiary()
  const [synopsis, setSynopsis] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true

    async function loadSynopsis() {
      if (!watchThisEntry) {
        return
      }

      setLoading(true)

      try {
        const metadata = await fetchMetadata({
          source: "tmdb",
          title: watchThisEntry.title,
          imdb_id: watchThisEntry.imdb_id ?? undefined,
          season: watchThisEntry.season ?? undefined,
          type:
            watchThisEntry.medium === "TV Show"
              ? "series"
              : watchThisEntry.medium === "Movie"
                ? "movie"
                : undefined,
        })

        if (active) {
          setSynopsis(metadata.plot ?? null)
        }
      } catch {
        if (active) {
          setSynopsis(null)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadSynopsis()

    return () => {
      active = false
    }
  }, [fetchMetadata, watchThisEntry])

  return (
    <MediaScreenScrollView style={{ backgroundColor: MEDIA_SHEET_BACKGROUND }} contentContainerStyle={{ paddingTop: 20 }}>
      <MediaSurface style={{ padding: 20, borderRadius: 28 }}>
        {!watchThisEntry ? (
          <>
            <Text selectable style={{ fontSize: 17, fontWeight: "700", color: MEDIA_PRIMARY_TINT }}>
              No planned item selected
            </Text>
            <Text selectable style={{ fontSize: 14, lineHeight: 20, color: MEDIA_PRIMARY_TINT_MUTED }}>
              Return to the diary and pick a random planned entry first.
            </Text>
          </>
        ) : (
          <>
            <Text selectable style={{ fontSize: 34 }}>
              {getPlaceholderPoster(watchThisEntry.type)}
            </Text>
            <Text selectable style={{ fontSize: 22, fontWeight: "700", color: MEDIA_PRIMARY_TINT }}>
              {watchThisEntry.title}
            </Text>
            <MediaPill
              label={[watchThisEntry.medium, watchThisEntry.type, watchThisEntry.platform].filter(Boolean).join(" • ") || "Media"}
              muted
            />
            {loading ? <ActivityIndicator color={MEDIA_PRIMARY_TINT} /> : null}
            <Text selectable style={{ fontSize: 15, lineHeight: 22, color: MEDIA_PRIMARY_TINT_MUTED }}>
              {synopsis ?? "No synopsis available from TMDB for this item."}
            </Text>
          </>
        )}
      </MediaSurface>

      {watchThisEntry ? (
        <View style={{ flexDirection: "row", gap: 12 }}>
          <MediaButton
            label="Open in diary"
            onPress={() => {
              router.replace(`/media/entry/${watchThisEntry.id}`)
            }}
            style={{ flex: 1 }}
            variant="primary"
          />
          <MediaButton
            label="Close"
            onPress={() => {
              setActiveWatchThisEntryId(null)
              router.back()
            }}
            style={{ flex: 1 }}
            variant="secondary"
          />
        </View>
      ) : null}
    </MediaScreenScrollView>
  )
}
