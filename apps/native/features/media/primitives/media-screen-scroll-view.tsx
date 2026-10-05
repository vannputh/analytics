import type { ReactNode } from "react"
import { ScrollView, type ScrollViewProps } from "react-native"

import {
  MEDIA_LAYOUT_SIDE_PADDING,
  MEDIA_PAGE_BACKGROUND,
  MEDIA_SCREEN_BOTTOM_PADDING,
  MEDIA_SCREEN_GAP,
  MEDIA_SCREEN_TOP_PADDING,
} from "@/features/media/media-ui"

export function MediaScreenScrollView({
  children,
  contentContainerStyle,
  style,
  ...props
}: ScrollViewProps & { children: ReactNode }) {
  return (
    <ScrollView
      {...props}
      keyboardShouldPersistTaps={props.keyboardShouldPersistTaps ?? "handled"}
      style={[{ flex: 1, backgroundColor: MEDIA_PAGE_BACKGROUND }, style]}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[
        {
          paddingHorizontal: MEDIA_LAYOUT_SIDE_PADDING,
          paddingTop: MEDIA_SCREEN_TOP_PADDING,
          paddingBottom: MEDIA_SCREEN_BOTTOM_PADDING,
          gap: MEDIA_SCREEN_GAP,
        },
        contentContainerStyle,
      ]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  )
}
