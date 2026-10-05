import { PlatformColor, Text, View } from "react-native"

import { Image } from "expo-image"

import type { MediaEntry } from "@analytics/domain"

import { Symbol } from "@/components/symbol"
import { MediaButton } from "@/features/media/media-button"
import { MediaDetailSurface } from "@/features/media/components/media-detail-surface"

export function MediaDetailHeroSection({
  entry,
  onDelete,
  onEdit,
  onRestart,
}: {
  entry: MediaEntry
  onDelete(): void
  onEdit(): void
  onRestart(): void
}) {
  const subtitle = [entry.medium, entry.type, entry.platform].filter(Boolean).join(" • ") || "No classification details"

  return (
    <MediaDetailSurface gap={18} glass padding={20} shadow>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 16 }}>
        <View
          style={{
            width: 104,
            height: 152,
            borderRadius: 18,
            borderCurve: "continuous",
            overflow: "hidden",
            backgroundColor: PlatformColor("secondarySystemGroupedBackground"),
          }}
        >
          {entry.poster_url ? (
            <Image source={entry.poster_url} style={{ width: "100%", height: "100%" }} contentFit="cover" />
          ) : (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Symbol name="film" size={28} tintColor={PlatformColor("tertiaryLabel")} weight="medium" />
            </View>
          )}
        </View>

        <View style={{ flex: 1, gap: 8, paddingTop: 2 }}>
          <View
            style={{
              alignSelf: "flex-start",
              borderRadius: 999,
              borderCurve: "continuous",
              paddingHorizontal: 10,
              paddingVertical: 5,
              backgroundColor: "rgba(255,255,255,0.55)",
            }}
          >
            <Text selectable style={{ fontSize: 12, fontWeight: "700", color: PlatformColor("label") }}>
              {entry.status ?? "Uncategorized"}
            </Text>
          </View>

          <Text selectable style={{ fontSize: 28, fontWeight: "700", letterSpacing: -0.6, color: PlatformColor("label") }}>
            {entry.title}
          </Text>
          <Text selectable style={{ fontSize: 15, lineHeight: 22, color: PlatformColor("secondaryLabel") }}>
            {subtitle}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <MediaButton label="Edit" onPress={onEdit} style={{ flex: 1 }} variant="primary" />

        {entry.status === "Dropped" || entry.status === "On Hold" ? (
          <MediaButton label="Restart" onPress={onRestart} style={{ flex: 1 }} variant="secondary" />
        ) : null}
      </View>

      <MediaButton label="Delete" onPress={onDelete} variant="destructive" />
    </MediaDetailSurface>
  )
}
