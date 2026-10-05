import { memo } from "react"
import { Platform, PlatformColor, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native"

import * as Haptics from "expo-haptics"
import { Image } from "expo-image"

import { formatRelativeTime, getPlaceholderPoster, type MediaEntry } from "@analytics/domain"

import { AdaptiveGlass } from "@/components/adaptive-glass"
import { Symbol } from "@/components/symbol"
import {
  MEDIA_CARD_BORDER,
  MEDIA_CARD_RADIUS,
  MEDIA_CARD_SHADOW,
  MEDIA_SOFT_TINT,
} from "@/features/media/media-ui"

const WATCHING_STRIP_CARD_BORDER = "rgba(255, 255, 255, 0.14)"
const WATCHING_STRIP_CARD_SHADOW = "0 12px 28px rgba(15, 23, 42, 0.08)"

function GlassChip({ label }: { label: string }) {
  return (
    <AdaptiveGlass
      style={{
        borderRadius: 999,
        borderCurve: "continuous",
        paddingHorizontal: 12,
        paddingVertical: 7,
      }}
    >
      <Text selectable numberOfLines={1} style={{ fontSize: 12, fontWeight: "700", color: PlatformColor("label") }}>
        {label}
      </Text>
    </AdaptiveGlass>
  )
}

const WatchingStripCard = memo(function WatchingStripCard({
  artworkHeight,
  cardWidth,
  entry,
  onIncrement,
  onOpen,
}: {
  artworkHeight: number
  cardWidth: number
  entry: MediaEntry
  onIncrement(): Promise<unknown>
  onOpen(): void
}) {
  const episodesWatched = entry.episodes_watched ?? 0
  const totalEpisodes = entry.episodes ?? null
  const hasEpisodeCount = Boolean(totalEpisodes && totalEpisodes > 0)
  const progressValue = hasEpisodeCount
    ? Math.max(0, Math.min(1, episodesWatched / (totalEpisodes ?? 1)))
    : 0
  const progressPercentLabel = hasEpisodeCount ? `${Math.round(progressValue * 100)}%` : null
  const overlayTimestamp = entry.last_watched_at ? formatRelativeTime(entry.last_watched_at) : "No recent watch"

  return (
    <View
      style={{
        width: cardWidth,
        height: artworkHeight,
        borderRadius: MEDIA_CARD_RADIUS,
        borderCurve: "continuous",
        overflow: "hidden",
        borderWidth: 0.5,
        borderColor: WATCHING_STRIP_CARD_BORDER,
        boxShadow: WATCHING_STRIP_CARD_SHADOW,
        backgroundColor: "transparent",
      }}
    >
      {/* Full-height poster */}
      <Pressable
        accessibilityRole="button"
        onPress={onOpen}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      >
        {entry.poster_url ? (
          <Image source={entry.poster_url} style={{ width: "100%", height: "100%" }} contentFit="cover" />
        ) : (
          <AdaptiveGlass style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: MEDIA_SOFT_TINT }}>
            <Text selectable style={{ fontSize: 96 }}>
              {getPlaceholderPoster(entry.type)}
            </Text>
          </AdaptiveGlass>
        )}
      </Pressable>

      {/* Top chips row */}
      {(entry.season || hasEpisodeCount) ? (
        <View style={{ position: "absolute", top: 16, left: 16, right: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          {entry.season ? <GlassChip label={`Season ${entry.season.replace(/\s*season$/i, "")}`} /> : <View />}
          {hasEpisodeCount ? <GlassChip label={`${episodesWatched}/${totalEpisodes}`} /> : null}
        </View>
      ) : null}

      {/* Glass bottom overlay panel */}
      <AdaptiveGlass
        style={{
          position: "absolute",
          left: 8,
          right: 8,
          bottom: 8,
          paddingHorizontal: 14,
          paddingVertical: 12,
          gap: 8,
          borderRadius: 18,
          borderCurve: "continuous",
        }}
        blurTint="systemUltraThinMaterial"
        blurIntensity={62}
      >
        {/* Title + add button row */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Text
            selectable
            numberOfLines={1}
            style={{ flex: 1, fontSize: 15, fontWeight: "600", color: PlatformColor("label") }}
          >
            {entry.title}
          </Text>
          <AdaptiveGlass
            isInteractive
            blurTint="systemChromeMaterialDark"
            style={{ borderRadius: 999, width: 32, height: 32, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.3)" }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add progress"
              onPress={() => {
                void Haptics.selectionAsync()
                void onIncrement()
              }}
              style={{ width: 32, height: 32, alignItems: "center", justifyContent: "center" }}
            >
              <Symbol name="plus" size={14} tintColor="white" weight="semibold" />
            </Pressable>
          </AdaptiveGlass>
        </View>

        {/* Progress bar + percentage */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              flex: 1,
              height: 4,
              borderRadius: 999,
              overflow: "hidden",
              backgroundColor: "rgba(128,128,128,0.22)",
            }}
          >
            <View
              style={{
                width: `${progressValue * 100}%`,
                height: "100%",
                borderRadius: 999,
                backgroundColor: PlatformColor("label"),
                opacity: 0.7,
              }}
            />
          </View>
          {progressPercentLabel ? (
            <Text
              selectable
              style={{
                fontSize: 11,
                fontWeight: "500",
                color: PlatformColor("secondaryLabel"),
                fontVariant: ["tabular-nums"],
                minWidth: 30,
                textAlign: "right",
              }}
            >
              {progressPercentLabel}
            </Text>
          ) : null}
        </View>

        {/* Timestamp footer */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <Symbol name="clock" size={11} tintColor={PlatformColor("tertiaryLabel")} />
          <Text
            selectable
            numberOfLines={1}
            style={{ fontSize: 11, color: PlatformColor("tertiaryLabel") }}
          >
            {overlayTimestamp}
          </Text>
        </View>
      </AdaptiveGlass>
    </View>
  )
})

const WatchingStripSkeleton = memo(function WatchingStripSkeleton({
  artworkHeight,
  cardWidth,
}: {
  artworkHeight: number
  cardWidth: number
}) {
  return (
    <AdaptiveGlass
      style={{
        width: cardWidth,
        height: artworkHeight,
        borderRadius: MEDIA_CARD_RADIUS,
        borderCurve: "continuous",
        overflow: "hidden",
        backgroundColor: MEDIA_SOFT_TINT,
        borderWidth: 0.5,
        borderColor: WATCHING_STRIP_CARD_BORDER,
        boxShadow: WATCHING_STRIP_CARD_SHADOW,
      }}
    >
      {/* Skeleton shimmer at bottom */}
      <AdaptiveGlass
        style={{
          position: "absolute",
          left: 8,
          right: 8,
          bottom: 8,
          paddingHorizontal: 14,
          paddingVertical: 12,
          gap: 8,
          borderRadius: 18,
          borderCurve: "continuous",
        }}
        blurTint="systemUltraThinMaterial"
        blurIntensity={62}
      >
        {/* Title + button row placeholder */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ width: "60%", height: 16, borderRadius: 6, backgroundColor: "rgba(128,128,128,0.2)" }} />
          <View style={{ width: 32, height: 32, borderRadius: 999, backgroundColor: "rgba(128,128,128,0.2)" }} />
        </View>
        {/* Progress bar placeholder */}
        <View style={{ height: 4, borderRadius: 999, backgroundColor: "rgba(128,128,128,0.2)" }} />
        {/* Timestamp placeholder */}
        <View style={{ width: 80, height: 12, borderRadius: 999, backgroundColor: "rgba(128,128,128,0.15)" }} />
      </AdaptiveGlass>
    </AdaptiveGlass>
  )
})

export function WatchingStrip({
  entries,
  loading,
  onIncrement,
  onOpenEntry,
}: {
  entries: MediaEntry[]
  loading: boolean
  onIncrement(entryId: string): Promise<unknown>
  onOpenEntry(entryId: string): void
}) {
  const { width } = useWindowDimensions()
  const edgeGap = 16
  const horizontalBleed = 18
  const shadowBleed = 18
  const cardWidth = Math.max(304, Math.min(360, Math.round(width * 0.8)))
  const artworkHeight = Math.max(420, Math.round(cardWidth * 1.4))

  if (!loading && entries.length === 0) {
    return null
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={cardWidth + edgeGap}
      snapToAlignment="start"
      disableIntervalMomentum
      style={{
        marginHorizontal: -horizontalBleed,
        marginVertical: -shadowBleed,
        backgroundColor: "transparent",
        overflow: "visible",
      }}
      contentInset={Platform.OS === "ios" ? { left: edgeGap, right: edgeGap } : undefined}
      contentOffset={Platform.OS === "ios" ? { x: -edgeGap, y: 0 } : undefined}
      contentContainerStyle={{
        gap: edgeGap,
        paddingHorizontal: Platform.OS === "ios" ? 0 : edgeGap,
        paddingVertical: shadowBleed,
      }}
    >
      {loading
        ? Array.from({ length: 3 }).map((_, index) => (
            <WatchingStripSkeleton key={index} artworkHeight={artworkHeight} cardWidth={cardWidth} />
          ))
        : entries.map((entry) => (
            <WatchingStripCard
              key={entry.id}
              artworkHeight={artworkHeight}
              cardWidth={cardWidth}
              entry={entry}
              onOpen={() => onOpenEntry(entry.id)}
              onIncrement={() => onIncrement(entry.id)}
            />
          ))}
    </ScrollView>
  )
}
