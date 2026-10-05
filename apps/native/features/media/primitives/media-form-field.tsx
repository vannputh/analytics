import type { ReactNode } from "react"
import { Text, View } from "react-native"

import { MEDIA_PANEL_GAP, MEDIA_PRIMARY_TINT_MUTED } from "@/features/media/media-ui"

export function MediaFormField({
  children,
  label,
}: {
  children: ReactNode
  label: string
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text selectable style={{ fontSize: 13, fontWeight: "700", color: MEDIA_PRIMARY_TINT_MUTED }}>
        {label}
      </Text>
      <View style={{ gap: MEDIA_PANEL_GAP - 6 }}>{children}</View>
    </View>
  )
}
