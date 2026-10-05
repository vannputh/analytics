import { PlatformColor, Text, View } from "react-native"

import { MediaDetailSurface } from "@/features/media/components/media-detail-surface"

export function MediaDetailStatusHistorySection({
  statusHistory,
}: {
  statusHistory: string[]
}) {
  return (
    <MediaDetailSurface>
      <Text selectable style={{ fontSize: 17, fontWeight: "600", color: PlatformColor("label") }}>
        Status history
      </Text>
      {statusHistory.length === 0 ? (
        <Text selectable style={{ fontSize: 15, lineHeight: 22, color: PlatformColor("secondaryLabel") }}>
          No status changes recorded yet.
        </Text>
      ) : (
        <View style={{ gap: 10 }}>
          {statusHistory.map((item) => (
            <View
              key={item}
              style={{
                borderRadius: 12,
                borderCurve: "continuous",
                padding: 14,
                backgroundColor: PlatformColor("secondarySystemGroupedBackground"),
              }}
            >
              <Text selectable style={{ fontSize: 14, lineHeight: 20, color: PlatformColor("label") }}>
                {item}
              </Text>
            </View>
          ))}
        </View>
      )}
    </MediaDetailSurface>
  )
}
