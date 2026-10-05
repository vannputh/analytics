import { PlatformColor, Text, View } from "react-native"

import { MediaButton } from "@/features/media/media-button"
import { MediaDetailSurface } from "@/features/media/components/media-detail-surface"

export function MediaDetailQuickActionsSection({
  onDecrement,
  onIncrement,
}: {
  onDecrement(): void
  onIncrement(): void
}) {
  return (
    <MediaDetailSurface>
      <Text selectable style={{ fontSize: 17, fontWeight: "600", color: PlatformColor("label") }}>
        Quick actions
      </Text>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <MediaButton label="Episode -" onPress={onDecrement} style={{ flex: 1 }} variant="secondary" />
        <MediaButton label="Episode +" onPress={onIncrement} style={{ flex: 1 }} variant="primary" />
      </View>
    </MediaDetailSurface>
  )
}
