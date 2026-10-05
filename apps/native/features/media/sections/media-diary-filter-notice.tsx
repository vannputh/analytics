import { PlatformColor, Text } from "react-native"

import { MediaSurface } from "@/features/media/media-surface"

export function MediaDiaryFilterNotice() {
  return (
    <MediaSurface glass>
      <Text selectable style={{ fontSize: 13, lineHeight: 18, color: PlatformColor("secondaryLabel") }}>
        Current filters apply to the Watched section and to search when the search sheet is set to Filtered.
      </Text>
    </MediaSurface>
  )
}
