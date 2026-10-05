import { Pressable, View } from "react-native"

import { MediaSearchResultContent } from "@/features/media/media-search-result-content"
import { MediaSurface } from "@/features/media/media-surface"
import type { MediaSearchListItem } from "@/features/media/media-types"

export function MediaSearchResultRow({
  item,
  onPress,
}: {
  item: MediaSearchListItem
  onPress(): void
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <View pointerEvents="none">
        <MediaSurface glass shadow={false} style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <MediaSearchResultContent item={item} />
        </MediaSurface>
      </View>
    </Pressable>
  )
}
