import { View, type StyleProp, type ViewStyle } from "react-native"

import { AdaptiveGlass } from "@/components/adaptive-glass"
import {
  MEDIA_CARD_BACKGROUND,
  MEDIA_CARD_BORDER,
  MEDIA_CARD_SHADOW,
  MEDIA_PANEL_RADIUS,
} from "@/features/media/media-ui"

export function MediaSurface({
  children,
  gap = 16,
  padding = 18,
  shadow = true,
  glass = false,
  style,
}: {
  children: React.ReactNode
  gap?: number
  padding?: number
  shadow?: boolean
  /** Use iOS 26 liquid glass (or BlurView fallback) instead of a solid white background */
  glass?: boolean
  style?: StyleProp<ViewStyle>
}) {
  const baseStyle: StyleProp<ViewStyle> = [
    {
      gap,
      padding,
      borderRadius: MEDIA_PANEL_RADIUS,
      borderCurve: "continuous",
      borderWidth: 1,
      borderColor: MEDIA_CARD_BORDER,
      backgroundColor: glass ? "transparent" : MEDIA_CARD_BACKGROUND,
      boxShadow: shadow ? MEDIA_CARD_SHADOW : undefined,
    },
    style,
  ]

  if (glass) {
    return (
      <AdaptiveGlass style={baseStyle}>
        {children}
      </AdaptiveGlass>
    )
  }

  return (
    <View style={baseStyle}>
      {children}
    </View>
  )
}
