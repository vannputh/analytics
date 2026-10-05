import { ActivityIndicator, PlatformColor, Text } from "react-native"

import { MediaSurface } from "@/features/media/media-surface"
import { MEDIA_PRIMARY_TINT } from "@/features/media/media-ui"

export function MediaEmptyState({
  body,
  loading = false,
  title,
}: {
  body: string
  loading?: boolean
  title: string
}) {
  return (
    <MediaSurface
      glass
      style={{
        gap: 12,
        padding: 24,
        borderRadius: 26,
        borderCurve: "continuous",
        alignItems: "center",
      }}
    >
      {loading ? <ActivityIndicator color={MEDIA_PRIMARY_TINT} /> : null}
      <Text selectable style={{ fontSize: 20, fontWeight: "700", color: PlatformColor("label") }}>
        {title}
      </Text>
      <Text
        selectable
        style={{
          fontSize: 15,
          lineHeight: 22,
          textAlign: "center",
          color: PlatformColor("secondaryLabel"),
        }}
      >
        {body}
      </Text>
    </MediaSurface>
  )
}
