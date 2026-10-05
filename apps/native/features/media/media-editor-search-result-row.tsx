import { Keyboard, Pressable, View } from "react-native"

import { MediaSearchResultContent } from "@/features/media/media-search-result-content"
import type { MediaSearchListItem } from "@/features/media/media-types"
import {
  MEDIA_FORM_FILL,
  MEDIA_HAIRLINE,
  MEDIA_PRESSED_OVERLAY,
} from "@/features/media/media-ui"

export function MediaEditorSearchResultRow({
  item,
  onPress,
}: {
  item: MediaSearchListItem
  onPress(): void
}) {
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={8}
      onPress={() => {
        Keyboard.dismiss()
        onPress()
      }}
      onPressIn={() => {
        Keyboard.dismiss()
      }}
      style={({ pressed }) => ({
        borderRadius: 18,
        borderCurve: "continuous",
        backgroundColor: pressed ? MEDIA_PRESSED_OVERLAY : MEDIA_FORM_FILL,
        borderWidth: 1,
        borderColor: MEDIA_HAIRLINE,
        paddingHorizontal: 16,
        paddingVertical: 13,
      })}
    >
      <View pointerEvents="none" style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <MediaSearchResultContent item={item} />
      </View>
    </Pressable>
  )
}
