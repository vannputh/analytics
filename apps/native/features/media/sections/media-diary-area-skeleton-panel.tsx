import { useEffect, useRef } from "react"
import { Animated, View, useWindowDimensions } from "react-native"

import { AdaptiveGlass } from "@/components/adaptive-glass"
import type { MediaDiaryArea } from "@/features/media/media-types"
import { MediaSurface } from "@/features/media/media-surface"
import {
  MEDIA_CARD_BORDER,
  MEDIA_CARD_RADIUS,
  MEDIA_CARD_SHADOW,
  MEDIA_PANEL_RADIUS,
  MEDIA_SOFT_TINT,
} from "@/features/media/media-ui"

function MediaSkeletonBlock({
  opacity,
  style,
}: {
  opacity: Animated.Value
  style?: React.ComponentProps<typeof Animated.View>["style"]
}) {
  return (
    <Animated.View
      style={[
        {
          borderRadius: 10,
          backgroundColor: "rgba(120, 120, 128, 0.18)",
          opacity,
        },
        style,
      ]}
    />
  )
}

function MediaDiaryListSkeleton({ opacity }: { opacity: Animated.Value }) {
  return (
    <View style={{ gap: 12 }}>
      {Array.from({ length: 2 }).map((_, index) => (
        <MediaSurface
          key={index}
          glass
          gap={14}
          padding={0}
          style={{
            height: 190,
            overflow: "hidden",
            flexDirection: "row",
            alignItems: "stretch",
          }}
        >
          <View
            style={{
              width: 118,
              borderTopLeftRadius: MEDIA_PANEL_RADIUS,
              borderBottomLeftRadius: MEDIA_PANEL_RADIUS,
              overflow: "hidden",
            }}
          >
            <MediaSkeletonBlock opacity={opacity} style={{ flex: 1, borderRadius: 0 }} />
          </View>
          <View style={{ flex: 1, paddingHorizontal: 14, paddingVertical: 16, gap: 10, justifyContent: "center" }}>
            <MediaSkeletonBlock opacity={opacity} style={{ width: "72%", height: 18 }} />
            <MediaSkeletonBlock opacity={opacity} style={{ width: 96, height: 28, borderRadius: 999 }} />
            <MediaSkeletonBlock opacity={opacity} style={{ width: "56%", height: 12 }} />
            <MediaSkeletonBlock opacity={opacity} style={{ width: "42%", height: 12 }} />
          </View>
        </MediaSurface>
      ))}
    </View>
  )
}

function MediaDiaryPlannedSkeleton({ opacity }: { opacity: Animated.Value }) {
  const { width } = useWindowDimensions()
  const columns = width >= 820 ? 3 : 2
  const gap = 12
  const availableWidth = Math.max(0, width - 36)
  const cardWidth = Math.floor((availableWidth - gap * (columns - 1)) / columns)
  const cardHeight = Math.max(238, Math.round(cardWidth * 1.52))

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap }}>
      {Array.from({ length: columns * 2 }).map((_, index) => (
        <AdaptiveGlass
          key={index}
          style={{
            width: cardWidth,
            height: cardHeight,
            borderRadius: MEDIA_CARD_RADIUS,
            borderCurve: "continuous",
            overflow: "hidden",
            borderWidth: 1,
            borderColor: MEDIA_CARD_BORDER,
            boxShadow: MEDIA_CARD_SHADOW,
            backgroundColor: MEDIA_SOFT_TINT,
          }}
        >
          <MediaSkeletonBlock opacity={opacity} style={{ position: "absolute", inset: 0, borderRadius: 0 }} />
          <View
            style={{
              position: "absolute",
              top: 14,
              left: 14,
              right: 14,
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <MediaSkeletonBlock opacity={opacity} style={{ width: 54, height: 20, borderRadius: 999 }} />
            <MediaSkeletonBlock opacity={opacity} style={{ width: 24, height: 24, borderRadius: 999 }} />
          </View>
          <View
            style={{
              position: "absolute",
              left: 14,
              right: 14,
              bottom: 14,
              alignItems: "center",
            }}
          >
            <MediaSkeletonBlock opacity={opacity} style={{ width: "82%", height: 34, borderRadius: 16 }} />
          </View>
        </AdaptiveGlass>
      ))}
    </View>
  )
}

function MediaDiaryWatchingSkeleton({ opacity }: { opacity: Animated.Value }) {
  const { width } = useWindowDimensions()
  const edgeGap = 16
  const cardWidth = Math.max(304, Math.min(360, Math.round(width * 0.8)))
  const artworkHeight = Math.max(420, Math.round(cardWidth * 1.4))

  return (
    <View style={{ flexDirection: "row", gap: edgeGap }}>
      {Array.from({ length: 2 }).map((_, index) => (
        <AdaptiveGlass
          key={index}
          style={{
            width: cardWidth,
            height: artworkHeight,
            borderRadius: MEDIA_CARD_RADIUS,
            borderCurve: "continuous",
            overflow: "hidden",
            backgroundColor: MEDIA_SOFT_TINT,
            borderWidth: 0.5,
            borderColor: MEDIA_CARD_BORDER,
            boxShadow: MEDIA_CARD_SHADOW,
          }}
        >
          <MediaSkeletonBlock opacity={opacity} style={{ position: "absolute", inset: 0, borderRadius: 0 }} />
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
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <MediaSkeletonBlock opacity={opacity} style={{ width: "60%", height: 16 }} />
              <MediaSkeletonBlock opacity={opacity} style={{ width: 32, height: 32, borderRadius: 999 }} />
            </View>
            <MediaSkeletonBlock opacity={opacity} style={{ width: "100%", height: 4, borderRadius: 999 }} />
            <MediaSkeletonBlock opacity={opacity} style={{ width: 84, height: 12, borderRadius: 999 }} />
          </AdaptiveGlass>
        </AdaptiveGlass>
      ))}
    </View>
  )
}

export function MediaDiaryAreaSkeletonPanel({ activeArea }: { activeArea: MediaDiaryArea }) {
  const opacity = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.52,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    )

    animation.start()

    return () => {
      animation.stop()
    }
  }, [opacity])

  if (activeArea === "planned") {
    return <MediaDiaryPlannedSkeleton opacity={opacity} />
  }

  if (activeArea === "watching") {
    return <MediaDiaryWatchingSkeleton opacity={opacity} />
  }

  return <MediaDiaryListSkeleton opacity={opacity} />
}
