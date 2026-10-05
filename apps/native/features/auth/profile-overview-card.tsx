import { PlatformColor, Text, View } from "react-native"

import { Symbol } from "@/components/symbol"
import { MediaSurface } from "@/features/media/media-surface"

export function ProfileOverviewCard({
  detail,
  email,
  statusLabel,
}: {
  detail: string
  email: string
  statusLabel: string
}) {
  return (
    <MediaSurface glass style={{ gap: 18, padding: 20 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 18,
            borderCurve: "continuous",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(255,255,255,0.55)",
          }}
        >
          <Symbol name="person.crop.circle.fill" size={28} tintColor={PlatformColor("label")} />
        </View>

        <View style={{ flex: 1, gap: 3, minWidth: 0 }}>
          <Text
            selectable
            numberOfLines={2}
            style={{ fontSize: 22, fontWeight: "700", lineHeight: 27, color: PlatformColor("label") }}
          >
            {email}
          </Text>
          <Text selectable style={{ fontSize: 14, color: PlatformColor("secondaryLabel") }}>
            {statusLabel}
          </Text>
        </View>
      </View>

      <Text selectable style={{ fontSize: 14, lineHeight: 20, color: PlatformColor("secondaryLabel") }}>
        {detail}
      </Text>
    </MediaSurface>
  )
}
