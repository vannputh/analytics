import { PlatformColor, Text, View } from "react-native"

import { Image } from "expo-image"

import { getPlaceholderPoster } from "@analytics/domain"

import { AdaptiveGlass } from "@/components/adaptive-glass"
import { MediaPill } from "@/features/media/primitives/media-pill"
import type { MediaSearchListItem } from "@/features/media/media-types"

function SearchPoster({ posterUrl, type }: { posterUrl: string | null; type: string | null }) {
  if (posterUrl) {
    return (
      <Image
        source={posterUrl}
        style={{
          width: 52,
          height: 72,
          borderRadius: 14,
        }}
        contentFit="cover"
      />
    )
  }

  return (
    <AdaptiveGlass
      style={{
        width: 52,
        height: 72,
        borderRadius: 14,
        borderCurve: "continuous",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: 28 }}>{getPlaceholderPoster(type)}</Text>
    </AdaptiveGlass>
  )
}

export function MediaSearchResultContent({ item }: { item: MediaSearchListItem }) {
  return (
    <>
      <SearchPoster posterUrl={item.posterUrl} type={item.posterType} />

      <View style={{ flex: 1, gap: 6 }}>
        <Text numberOfLines={2} style={{ fontSize: 16, fontWeight: "700", color: PlatformColor("label") }}>
          {item.title}
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <MediaPill label={item.primaryLabel} muted selectable={false} />

          <Text numberOfLines={1} style={{ fontSize: 12, color: PlatformColor("tertiaryLabel"), flexShrink: 1 }}>
            {item.detailLabel}
          </Text>
        </View>

        {item.subtitle ? (
          <Text numberOfLines={1} style={{ fontSize: 13, color: PlatformColor("secondaryLabel") }}>
            {item.subtitle}
          </Text>
        ) : null}
      </View>
    </>
  )
}
