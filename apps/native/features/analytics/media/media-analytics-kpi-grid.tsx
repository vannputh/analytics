import { Text, View, useWindowDimensions } from "react-native"

import { Symbol } from "@/components/symbol"
import type { MediaAnalyticsKpiModel } from "@/features/analytics/media/media-analytics-presentation"
import { MediaSurface } from "@/features/media/media-surface"
import { MEDIA_HAIRLINE, MEDIA_PRIMARY_TINT, MEDIA_PRIMARY_TINT_MUTED } from "@/features/media/media-ui"

export function MediaAnalyticsKpiGrid({
  items,
}: {
  items: MediaAnalyticsKpiModel[]
}) {
  const { width } = useWindowDimensions()
  const compact = width < 380

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
      {items.map((item) => (
        <MediaSurface
          key={item.key}
          gap={10}
          padding={16}
          style={{
            flexBasis: compact ? "100%" : "48%",
            flexGrow: 1,
            minWidth: 0,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <Text
              selectable
              style={{
                flex: 1,
                color: MEDIA_PRIMARY_TINT_MUTED,
                fontSize: 11,
                fontWeight: "700",
                letterSpacing: 0.6,
                textTransform: "uppercase",
              }}
            >
              {item.label}
            </Text>
            <View
              style={{
                width: 30,
                height: 30,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 999,
                borderCurve: "continuous",
                backgroundColor: "#F3F4F6",
                borderWidth: 1,
                borderColor: MEDIA_HAIRLINE,
              }}
            >
              <Symbol name={item.icon} size={15} tintColor={MEDIA_PRIMARY_TINT} />
            </View>
          </View>
          <Text
            selectable
            numberOfLines={1}
            style={{ color: MEDIA_PRIMARY_TINT, fontSize: 22, fontWeight: "700" }}
          >
            {item.value}
          </Text>
          <Text
            selectable
            numberOfLines={2}
            style={{ color: MEDIA_PRIMARY_TINT_MUTED, fontSize: 12, lineHeight: 18 }}
          >
            {item.detail}
          </Text>
        </MediaSurface>
      ))}
    </View>
  )
}
