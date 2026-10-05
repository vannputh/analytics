import { PlatformColor, Text, View } from "react-native"

import { MediaButton } from "@/features/media/media-button"
import { MediaSurface } from "@/features/media/media-surface"

export function ProfileActionsSection({
  detail,
  onSignOut,
}: {
  detail: string
  onSignOut(): void
}) {
  return (
    <MediaSurface style={{ gap: 16 }}>
      <View style={{ gap: 4 }}>
        <Text selectable style={{ fontSize: 13, fontWeight: "700", color: PlatformColor("secondaryLabel") }}>
          Actions
        </Text>
        <Text selectable style={{ fontSize: 14, lineHeight: 20, color: PlatformColor("secondaryLabel") }}>
          {detail}
        </Text>
      </View>

      <MediaButton
        fullWidth
        icon="rectangle.portrait.and.arrow.right"
        label="Sign Out"
        onPress={onSignOut}
        variant="destructive"
      />
    </MediaSurface>
  )
}
