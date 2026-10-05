import type { ReactNode } from "react"
import type { StyleProp, ViewStyle } from "react-native"

import { MediaSurface } from "@/features/media/media-surface"

export function MediaDetailSurface({
  children,
  gap = 14,
  glass = false,
  padding = 18,
  shadow = false,
  style,
}: {
  children: ReactNode
  gap?: number
  glass?: boolean
  padding?: number
  shadow?: boolean
  style?: StyleProp<ViewStyle>
}) {
  return (
    <MediaSurface gap={gap} glass={glass} padding={padding} shadow={shadow} style={style}>
      {children}
    </MediaSurface>
  )
}
