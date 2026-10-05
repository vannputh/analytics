import { memo } from "react"
import { PlatformColor, Pressable, Text, View } from "react-native"

import { Image } from "expo-image"

import { formatDate, getPlaceholderPoster, getTimeTaken, type MediaEntry } from "@analytics/domain"

import { AdaptiveGlass } from "@/components/adaptive-glass"
import type { MediaDisplayPreferences } from "@/features/media/media-types"
import {
  MEDIA_CARD_BORDER,
  MEDIA_CARD_RADIUS,
  MEDIA_CARD_SHADOW,
  MEDIA_SOFT_TINT,
} from "@/features/media/media-ui"

const CARD_HEIGHT = 190
// Glass panel starts this many points from the left edge — poster bleeds behind the overlap
const GLASS_LEFT = 118

function renderMetaLabel(entry: MediaEntry) {
  if (entry.status === "Finished") {
    return `Finished ${formatDate(entry.finish_date)}`
  }

  if (entry.status === "Watching" || entry.status === "Currently Watching") {
    return entry.last_watched_at ? `Last watched ${formatDate(entry.last_watched_at)}` : "In progress"
  }

  if (entry.start_date) {
    return `Started ${formatDate(entry.start_date)}`
  }

  return "No date recorded"
}

// Plain frosted pill — avoids double-blur inside the glass panel
function StatusChip({ label }: { label: string }) {
  return (
    <View
      style={{
        alignSelf: "flex-start",
        borderRadius: 999,
        borderCurve: "continuous",
        paddingHorizontal: 10,
        paddingVertical: 5,
        backgroundColor: "rgba(255,255,255,0.20)",
        borderWidth: 0.5,
        borderColor: "rgba(255,255,255,0.40)",
      }}
    >
      <Text selectable numberOfLines={1} style={{ fontSize: 12, fontWeight: "600", color: PlatformColor("label") }}>
        {label}
      </Text>
    </View>
  )
}

export const MediaEntryCard = memo(function MediaEntryCard({
  displayPreferences,
  entry,
  onOpenEntry,
}: {
  displayPreferences: MediaDisplayPreferences
  entry: MediaEntry
  onOpenEntry(entryId: string): void
}) {
  const timeTaken = getTimeTaken(entry.time_taken, entry.start_date, entry.finish_date)

  const ratingLine = [
    displayPreferences.showAverageRating && entry.average_rating ? `Avg ${entry.average_rating}/10` : null,
    entry.my_rating ? `${entry.my_rating}/10` : null,
    displayPreferences.showTimeTaken && timeTaken ? timeTaken : null,
  ]
    .filter(Boolean)
    .join("  ·  ")

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onOpenEntry(entry.id)}
      style={{
        height: CARD_HEIGHT,
        borderRadius: MEDIA_CARD_RADIUS,
        borderCurve: "continuous",
        overflow: "hidden",
        borderWidth: 1,
        borderColor: MEDIA_CARD_BORDER,
        boxShadow: MEDIA_CARD_SHADOW,
      }}
    >
      {/* Poster fills entire card background — bleeds behind the glass panel */}
      {entry.poster_url ? (
        <Image
          source={entry.poster_url}
          recyclingKey={entry.id}
          cachePolicy="memory-disk"
          style={{ position: "absolute", width: "100%", height: "100%" }}
          contentFit="cover"
        />
      ) : (
        <AdaptiveGlass
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            alignItems: "flex-start",
            justifyContent: "center",
            paddingLeft: 20,
            backgroundColor: MEDIA_SOFT_TINT,
          }}
        >
          <Text selectable style={{ fontSize: 64 }}>
            {getPlaceholderPoster(entry.type)}
          </Text>
        </AdaptiveGlass>
      )}

      {/* Glass content panel — overlaps poster on left edge for the bleed-through effect */}
      <AdaptiveGlass
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: GLASS_LEFT,
          paddingHorizontal: 14,
          paddingVertical: 14,
          gap: 9,
          justifyContent: "center",
          borderLeftWidth: 0.5,
          borderLeftColor: "rgba(255,255,255,0.28)",
        }}
        blurTint="systemThinMaterial"
        blurIntensity={88}
      >
        <Text
          selectable
          numberOfLines={2}
          style={{ fontSize: 15, fontWeight: "600", color: PlatformColor("label"), lineHeight: 20 }}
        >
          {entry.title}
        </Text>

        <StatusChip label={entry.status ?? "Uncategorized"} />

        {displayPreferences.showDates ? (
          <Text selectable numberOfLines={1} style={{ fontSize: 12, color: PlatformColor("secondaryLabel") }}>
            {renderMetaLabel(entry)}
          </Text>
        ) : null}

        {ratingLine ? (
          <Text selectable numberOfLines={1} style={{ fontSize: 12, color: PlatformColor("tertiaryLabel") }}>
            {ratingLine}
          </Text>
        ) : null}
      </AdaptiveGlass>

    </Pressable>
  )
})
