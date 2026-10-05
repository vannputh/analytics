import { Pressable, ScrollView, Text, View } from "react-native"

import type {
  MediaAnalyticsBreakdownSectionModel,
  MediaAnalyticsMonthlySectionModel,
} from "@/features/analytics/media/media-analytics-presentation"
import { MediaSurface } from "@/features/media/media-surface"
import {
  MEDIA_FORM_FILL,
  MEDIA_HAIRLINE,
  MEDIA_PRIMARY_TINT,
  MEDIA_PRIMARY_TINT_MUTED,
} from "@/features/media/media-ui"

function SectionTitle({ title }: { title: string }) {
  return (
    <Text selectable style={{ color: MEDIA_PRIMARY_TINT, fontSize: 17, fontWeight: "700" }}>
      {title}
    </Text>
  )
}

export function MediaAnalyticsMonthlySections({
  onItemPress,
  sections,
}: {
  onItemPress?(sectionKey: string, item: { key: string; label: string }): void
  sections: MediaAnalyticsMonthlySectionModel[]
}) {
  return (
    <View style={{ gap: 12 }}>
      {sections.map((section) => (
        <MediaSurface key={section.key} gap={16}>
          <SectionTitle title={section.title} />
          {section.items.length === 0 ? (
            <Text selectable style={{ color: MEDIA_PRIMARY_TINT_MUTED, fontSize: 14, lineHeight: 20 }}>
              {section.emptyMessage}
            </Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 14, paddingRight: 6 }}
            >
              {section.items.map((item) => {
                const content = (
                  <>
                    <Text
                      selectable
                      numberOfLines={1}
                      style={{ color: MEDIA_PRIMARY_TINT, fontSize: 12, fontWeight: "700" }}
                    >
                      {item.valueLabel}
                    </Text>
                    <View
                      style={{
                        height: 144,
                        justifyContent: "flex-end",
                        borderRadius: 18,
                        borderCurve: "continuous",
                        backgroundColor: MEDIA_FORM_FILL,
                        padding: 8,
                      }}
                    >
                      <View
                        style={{
                          height: Math.max(10, item.fraction * 112),
                          borderRadius: 12,
                          borderCurve: "continuous",
                          backgroundColor: MEDIA_PRIMARY_TINT,
                        }}
                      />
                    </View>
                    <View style={{ gap: 2 }}>
                      <Text selectable style={{ color: MEDIA_PRIMARY_TINT, fontSize: 13, fontWeight: "600" }}>
                        {item.label}
                      </Text>
                      <Text selectable style={{ color: MEDIA_PRIMARY_TINT_MUTED, fontSize: 12 }}>
                        {item.secondaryLabel}
                      </Text>
                    </View>
                  </>
                )

                if (!onItemPress) {
                  return (
                    <View key={item.key} style={{ width: 76, gap: 10 }}>
                      {content}
                    </View>
                  )
                }

                return (
                  <Pressable
                    key={item.key}
                    accessibilityRole="button"
                    onPress={() => onItemPress(section.key, { key: item.key, label: item.label })}
                    style={{ width: 76, gap: 10 }}
                  >
                    {content}
                  </Pressable>
                )
              })}
            </ScrollView>
          )}
        </MediaSurface>
      ))}
    </View>
  )
}

export function MediaAnalyticsBreakdownSections({
  onItemPress,
  sections,
}: {
  onItemPress?(sectionKey: string, item: { key: string; label: string }): void
  sections: MediaAnalyticsBreakdownSectionModel[]
}) {
  return (
    <View style={{ gap: 12 }}>
      {sections.map((section) => (
        <MediaSurface key={section.key} gap={14}>
          <SectionTitle title={section.title} />
          {section.items.length === 0 ? (
            <Text selectable style={{ color: MEDIA_PRIMARY_TINT_MUTED, fontSize: 14, lineHeight: 20 }}>
              {section.emptyMessage}
            </Text>
          ) : (
            <View
              style={{
                gap: 12,
                borderTopWidth: 1,
                borderTopColor: MEDIA_HAIRLINE,
                paddingTop: 12,
              }}
            >
              {section.items.map((item) => {
                const content = (
                  <>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <Text
                        selectable
                        numberOfLines={1}
                        style={{ flex: 1, color: MEDIA_PRIMARY_TINT, fontSize: 15, fontWeight: "600" }}
                      >
                        {item.label}
                      </Text>
                      <Text
                        selectable
                        style={{
                          color: MEDIA_PRIMARY_TINT_MUTED,
                          fontSize: 13,
                          fontVariant: ["tabular-nums"],
                        }}
                      >
                        {item.valueLabel}
                      </Text>
                    </View>
                    <View
                      style={{
                        height: 10,
                        overflow: "hidden",
                        borderRadius: 999,
                        borderCurve: "continuous",
                        backgroundColor: MEDIA_FORM_FILL,
                      }}
                    >
                      <View
                        style={{
                          width: `${Math.max(6, Math.round(item.fraction * 100))}%`,
                          height: "100%",
                          borderRadius: 999,
                          borderCurve: "continuous",
                          backgroundColor: MEDIA_PRIMARY_TINT,
                        }}
                      />
                    </View>
                  </>
                )

                if (!onItemPress) {
                  return (
                    <View key={item.key} style={{ gap: 8 }}>
                      {content}
                    </View>
                  )
                }

                return (
                  <Pressable
                    key={item.key}
                    accessibilityRole="button"
                    onPress={() => onItemPress(section.key, { key: item.key, label: item.label })}
                    style={{ gap: 8 }}
                  >
                    {content}
                  </Pressable>
                )
              })}
            </View>
          )}
        </MediaSurface>
      ))}
    </View>
  )
}
