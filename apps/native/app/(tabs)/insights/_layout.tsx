import { Pressable, Text, View } from "react-native"

import { router, Stack } from "expo-router"

import { Symbol } from "@/components/symbol"
import { FoodAnalyticsProvider, useFoodAnalytics } from "@/features/analytics/food/food-analytics-provider"
import { InsightsWorkspaceProvider, useInsightsWorkspace } from "@/features/analytics/insights-workspace"
import { MediaAnalyticsProvider, useMediaAnalytics } from "@/features/analytics/media/media-analytics-provider"
import { MEDIA_PRIMARY_TINT, MEDIA_PRIMARY_TINT_MUTED } from "@/features/media/media-ui"
import { createMediaAppStoreHeaderOptions } from "@/features/media/media-app-store-header"

export default function InsightsLayout() {
  return (
    <MediaAnalyticsProvider>
      <FoodAnalyticsProvider>
        <InsightsWorkspaceProvider>
          <Stack>
            <Stack.Screen
              name="index"
              options={createMediaAppStoreHeaderOptions({
                headerLargeTitle: true,
                headerRight: () => <InsightsFilterButton />,
                title: "Analytics",
              })}
            />
            <Stack.Screen
              name="filters"
              options={{
                presentation: "formSheet",
                title: "Filters",
              }}
            />
            <Stack.Screen
              name="filters/[group]"
              options={{
                title: "Options",
              }}
            />
          </Stack>
        </InsightsWorkspaceProvider>
      </FoodAnalyticsProvider>
    </MediaAnalyticsProvider>
  )
}

function InsightsFilterButton() {
  const { workspace } = useInsightsWorkspace()
  const media = useMediaAnalytics()
  const food = useFoodAnalytics()
  const activeFilterCount = workspace === "food" ? food.activeFilterCount : media.activeFilterCount

  return (
    <Pressable
      accessibilityLabel="Open analytics filters"
      accessibilityRole="button"
      hitSlop={10}
      onPress={() => router.push("/insights/filters")}
      style={{
        width: 36,
        height: 36,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View>
        <Symbol name="line.3.horizontal.decrease.circle" size={20} tintColor={MEDIA_PRIMARY_TINT} />
        {activeFilterCount > 0 ? (
          <View
            style={{
              position: "absolute",
              right: -10,
              top: -5,
              minWidth: 18,
              height: 18,
              paddingHorizontal: 4,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 999,
              borderCurve: "continuous",
              backgroundColor: MEDIA_PRIMARY_TINT,
            }}
          >
            <Text
              selectable
              style={{
                color: "#FFFFFF",
                fontSize: 10,
                fontVariant: ["tabular-nums"],
                fontWeight: "700",
              }}
            >
              {activeFilterCount}
            </Text>
          </View>
        ) : (
          <View
            style={{
              position: "absolute",
              right: -3,
              top: -1,
              width: 8,
              height: 8,
              borderRadius: 999,
              borderCurve: "continuous",
              backgroundColor: MEDIA_PRIMARY_TINT_MUTED,
              opacity: 0.22,
            }}
          />
        )}
      </View>
    </Pressable>
  )
}
