import { LayoutAnimation, Pressable, ScrollView, Text } from "react-native"

import { Symbol } from "@/components/symbol"
import type { MediaDiaryArea } from "@/features/media/media-types"
import { MEDIA_LAYOUT_SIDE_PADDING } from "@/features/media/media-ui"
import {
  createMediaDiaryAreaSwitcherSegments,
  MEDIA_DIARY_AREA_SWITCHER_SELECTED_BACKGROUND,
  MEDIA_DIARY_AREA_SWITCHER_SELECTED_TEXT,
  MEDIA_DIARY_AREA_SWITCHER_UNSELECTED_BACKGROUND,
  MEDIA_DIARY_AREA_SWITCHER_UNSELECTED_BORDER,
  MEDIA_DIARY_AREA_SWITCHER_UNSELECTED_TEXT,
} from "@/features/media/sections/media-diary-area-switcher-theme"

export function MediaDiaryAreaSwitcher({
  activeArea,
  onChange,
}: {
  activeArea: MediaDiaryArea
  onChange(nextArea: MediaDiaryArea): void
}) {
  const segments = createMediaDiaryAreaSwitcherSegments(activeArea, onChange)
  const shadowBleed = 12

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      alwaysBounceHorizontal={false}
      style={{
        marginHorizontal: -MEDIA_LAYOUT_SIDE_PADDING,
        marginVertical: -shadowBleed,
        backgroundColor: "transparent",
        overflow: "visible",
      }}
      contentContainerStyle={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: shadowBleed,
        paddingLeft: MEDIA_LAYOUT_SIDE_PADDING + 2,
        paddingRight: MEDIA_LAYOUT_SIDE_PADDING,
      }}
    >
      {segments.map((segment) => (
        <Pressable
          key={segment.area}
          accessibilityLabel={segment.label}
          accessibilityRole="button"
          accessibilityState={{ selected: segment.selected }}
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
            segment.onPress()
          }}
          style={({ pressed }) => ({
            minHeight: 38,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 999,
            borderCurve: "continuous",
            backgroundColor: segment.selected
              ? MEDIA_DIARY_AREA_SWITCHER_SELECTED_BACKGROUND
              : MEDIA_DIARY_AREA_SWITCHER_UNSELECTED_BACKGROUND,
            borderWidth: segment.selected ? 0 : 0.5,
            borderColor: segment.selected ? "transparent" : MEDIA_DIARY_AREA_SWITCHER_UNSELECTED_BORDER,
            boxShadow: segment.selected ? "0 8px 18px rgba(17, 17, 17, 0.14)" : "0 4px 12px rgba(17, 17, 17, 0.05)",
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <Symbol
            name={segment.icon}
            size={16}
            tintColor={segment.selected ? MEDIA_DIARY_AREA_SWITCHER_SELECTED_TEXT : MEDIA_DIARY_AREA_SWITCHER_UNSELECTED_TEXT}
            weight="semibold"
          />
          <Text
            numberOfLines={1}
            style={{
              fontSize: 15,
              fontWeight: "700",
              color: segment.selected
                ? MEDIA_DIARY_AREA_SWITCHER_SELECTED_TEXT
                : MEDIA_DIARY_AREA_SWITCHER_UNSELECTED_TEXT,
            }}
          >
            {segment.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  )
}
