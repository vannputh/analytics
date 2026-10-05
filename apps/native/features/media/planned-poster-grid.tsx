import { PlatformColor, Pressable, Text, View, useWindowDimensions } from "react-native"

import { Image } from "expo-image"

import { getPlaceholderPoster, type MediaEntry } from "@analytics/domain"

import { AdaptiveGlass } from "@/components/adaptive-glass"
import {
  MEDIA_CARD_BORDER,
  MEDIA_CARD_RADIUS,
  MEDIA_CARD_SHADOW,
  MEDIA_SOFT_TINT,
} from "@/features/media/media-ui"

function GlassChip({ label }: { label: string }) {
  return (
    <AdaptiveGlass
      style={{
        borderRadius: 999,
        borderCurve: "continuous",
        paddingHorizontal: 8,
        paddingVertical: 5,
      }}
      blurTint="systemUltraThinMaterial"
      blurIntensity={62}
    >
      <Text
        selectable
        numberOfLines={1}
        style={{ fontSize: 6, fontWeight: "600", color: PlatformColor("label") }}
      >
        {label}
      </Text>
    </AdaptiveGlass>
  )
}

function PlannedPosterCard({
  cardHeight,
  cardWidth,
  entry,
  onPress,
}: {
  cardHeight: number
  cardWidth: number
  entry: MediaEntry
  onPress(): void
}) {
  const typeLabel = entry.type || "Media"

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        width: cardWidth,
        height: cardHeight,
        borderRadius: MEDIA_CARD_RADIUS,
        borderCurve: "continuous",
        overflow: "hidden",
        borderWidth: 1,
        borderColor: MEDIA_CARD_BORDER,
        boxShadow: MEDIA_CARD_SHADOW,
        backgroundColor: "transparent",
      }}
    >
      {entry.poster_url ? (
        <Image source={entry.poster_url} style={{ width: "100%", height: "100%" }} contentFit="cover" />
      ) : (
        <AdaptiveGlass
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: MEDIA_SOFT_TINT,
          }}
        >
          <Text selectable style={{ fontSize: Math.max(52, Math.round(cardWidth * 0.34)) }}>
            {getPlaceholderPoster(entry.type)}
          </Text>
        </AdaptiveGlass>
      )}

      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          top: 14,
          left: 14,
          right: 14,
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <GlassChip label={typeLabel} />
      </View>

      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          left: 14,
          right: 14,
          bottom: 14,
          height: 44,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AdaptiveGlass
          style={{
            maxWidth: "100%",
            borderRadius: 16,
            borderCurve: "continuous",
            paddingHorizontal: 10,
            paddingVertical: 6,
          }}
          blurTint="systemUltraThinMaterial"
          blurIntensity={62}
        >
          <Text
            selectable
            numberOfLines={2}
            style={{
              fontSize: 11,
              fontWeight: "600",
              color: PlatformColor("label"),
              textAlign: "center",
            }}
          >
            {entry.title}
          </Text>
        </AdaptiveGlass>
      </View>
    </Pressable>
  )
}

export function PlannedPosterGrid({
  entries,
  onOpenEntry,
}: {
  entries: MediaEntry[]
  onOpenEntry(entryId: string): void
}) {
  const { width } = useWindowDimensions()
  const columns = width >= 820 ? 3 : 2
  const gap = 12
  const availableWidth = Math.max(0, width - 36)
  const cardWidth = Math.floor((availableWidth - gap * (columns - 1)) / columns)
  const cardHeight = Math.max(238, Math.round(cardWidth * 1.52))

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap }}>
      {entries.map((entry) => (
        <PlannedPosterCard
          key={entry.id}
          cardHeight={cardHeight}
          cardWidth={cardWidth}
          entry={entry}
          onPress={() => onOpenEntry(entry.id)}
        />
      ))}
    </View>
  )
}
