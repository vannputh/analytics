import type { ReactNode } from "react"
import { PlatformColor, Text, View } from "react-native"

import { MediaButton } from "@/features/media/media-button"
import { MediaDetailSurface } from "@/features/media/components/media-detail-surface"

export function MediaDetailMetadataSection({
  children,
  loading,
  onFetchOmdb,
  onFetchTmdb,
}: {
  children?: ReactNode
  loading: boolean
  onFetchOmdb(): void
  onFetchTmdb(): void
}) {
  return (
    <MediaDetailSurface>
      <Text selectable style={{ fontSize: 17, fontWeight: "600", color: PlatformColor("label") }}>
        Metadata refresh
      </Text>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <MediaButton
          label={loading ? "Loading…" : "TMDB"}
          onPress={onFetchTmdb}
          style={{ flex: 1 }}
          variant="primary"
        />
        <MediaButton
          label={loading ? "Loading…" : "OMDB"}
          onPress={onFetchOmdb}
          style={{ flex: 1 }}
          variant="secondary"
        />
      </View>
      {children}
    </MediaDetailSurface>
  )
}
