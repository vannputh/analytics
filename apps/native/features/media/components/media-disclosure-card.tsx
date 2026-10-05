import { Pressable, Text, View } from "react-native"

import { Symbol } from "@/components/symbol"
import { MediaSurface } from "@/features/media/media-surface"
import { MEDIA_PRIMARY_TINT, MEDIA_PRIMARY_TINT_MUTED } from "@/features/media/media-ui"

export function MediaDisclosureCard({
  children,
  open,
  subtitle,
  title,
  onToggle,
}: {
  children: React.ReactNode
  open: boolean
  subtitle: string
  title: string
  onToggle(): void
}) {
  return (
    <MediaSurface gap={0} padding={0}>
      <Pressable
        accessibilityRole="button"
        onPress={onToggle}
        style={{
          paddingHorizontal: 18,
          paddingVertical: 18,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <View style={{ flex: 1, gap: 4 }}>
          <Text selectable style={{ fontSize: 17, fontWeight: "700", color: MEDIA_PRIMARY_TINT }}>
            {title}
          </Text>
          <Text selectable style={{ fontSize: 13, lineHeight: 18, color: MEDIA_PRIMARY_TINT_MUTED }}>
            {subtitle}
          </Text>
        </View>
        <Symbol
          name={open ? "chevron.up" : "chevron.down"}
          size={16}
          tintColor={MEDIA_PRIMARY_TINT_MUTED}
        />
      </Pressable>
      {open ? <View style={{ paddingHorizontal: 18, paddingBottom: 18 }}>{children}</View> : null}
    </MediaSurface>
  )
}
