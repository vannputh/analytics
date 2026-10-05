import { Pressable, ScrollView, Text, View } from "react-native"

import { router, Stack, useLocalSearchParams } from "expo-router"

import { Symbol } from "@/components/symbol"
import { MediaButton } from "@/features/media/media-button"
import { MediaSurface } from "@/features/media/media-surface"
import {
  MEDIA_HAIRLINE,
  MEDIA_PRIMARY_TINT,
  MEDIA_SHEET_BACKGROUND,
} from "@/features/media/media-ui"
import { useMediaAnalytics } from "@/features/analytics/media/media-analytics-provider"
import {
  clearMediaAnalyticsFilterGroup,
  getMediaAnalyticsFilterGroupConfig,
  isMediaAnalyticsFilterGroupKey,
  toggleMediaAnalyticsFilterValue,
} from "@/features/analytics/media/media-analytics-state"

export function MediaAnalyticsFilterGroupScreen() {
  const params = useLocalSearchParams<{ group?: string | string[] }>()
  const rawGroup = Array.isArray(params.group) ? params.group[0] : params.group
  const groupKey = rawGroup && isMediaAnalyticsFilterGroupKey(rawGroup) ? rawGroup : null
  const config = rawGroup ? getMediaAnalyticsFilterGroupConfig(rawGroup) : null
  const { filterOptions, filters, setFilters } = useMediaAnalytics()

  const values = groupKey ? filterOptions[groupKey] : []
  const selectedValues = groupKey ? filters[groupKey] : []

  function toggleValue(value: string) {
    if (!groupKey) {
      return
    }

    setFilters((current) => toggleMediaAnalyticsFilterValue(current, groupKey, value))
  }

  return (
    <>
      <Stack.Screen options={{ title: config?.title ?? "Filters" }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: MEDIA_SHEET_BACKGROUND }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 40 }}
      >
        {groupKey && values.length > 0 ? (
          <MediaSurface gap={0} padding={0}>
            {values.map((value, index) => {
              const active = selectedValues.includes(value)

              return (
                <Pressable
                  key={value}
                  accessibilityRole="button"
                  onPress={() => toggleValue(value)}
                  style={{
                    minHeight: 54,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 18,
                    paddingVertical: 14,
                    borderBottomWidth: index === values.length - 1 ? 0 : 1,
                    borderBottomColor: MEDIA_HAIRLINE,
                  }}
                >
                  <Text selectable style={{ flex: 1, fontSize: 16, color: MEDIA_PRIMARY_TINT }}>
                    {value}
                  </Text>
                  {active ? <Symbol name="checkmark" size={16} tintColor={MEDIA_PRIMARY_TINT} /> : null}
                </Pressable>
              )
            })}
          </MediaSurface>
        ) : (
          <MediaSurface>
            <Text selectable style={{ fontSize: 15, fontWeight: "700", color: MEDIA_PRIMARY_TINT }}>
              No options yet
            </Text>
          </MediaSurface>
        )}

        {groupKey ? (
          <View style={{ flexDirection: "row", gap: 12 }}>
            <MediaButton
              label="Clear"
              onPress={() => setFilters((current) => clearMediaAnalyticsFilterGroup(current, groupKey))}
              style={{ flex: 1 }}
              variant="secondary"
            />
            <MediaButton label="Done" onPress={() => router.back()} style={{ flex: 1 }} variant="primary" />
          </View>
        ) : null}
      </ScrollView>
    </>
  )
}
