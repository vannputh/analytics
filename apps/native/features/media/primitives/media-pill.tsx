import { PlatformColor, Text } from "react-native"

import { AdaptiveGlass } from "@/components/adaptive-glass"
import {
  MEDIA_GLASS_INTENSITY_SOFT,
  MEDIA_PILL_RADIUS,
} from "@/features/media/media-ui"

export function MediaPill({
  label,
  muted = false,
  selectable = true,
}: {
  label: string
  muted?: boolean
  selectable?: boolean
}) {
  return (
    <AdaptiveGlass
      blurTint="systemUltraThinMaterial"
      blurIntensity={MEDIA_GLASS_INTENSITY_SOFT}
      style={{
        alignSelf: "flex-start",
        borderRadius: MEDIA_PILL_RADIUS,
        borderCurve: "continuous",
        paddingHorizontal: 10,
        paddingVertical: 6,
      }}
    >
      <Text
        selectable={selectable}
        numberOfLines={1}
        style={{
          fontSize: 11,
          fontWeight: "700",
          color: muted ? PlatformColor("secondaryLabel") : PlatformColor("label"),
        }}
      >
        {label}
      </Text>
    </AdaptiveGlass>
  )
}
