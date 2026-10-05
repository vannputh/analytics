import { PlatformColor, RefreshControl, Text, View } from "react-native"

import * as Haptics from "expo-haptics"
import { router } from "expo-router"

import { useFoodAnalytics } from "@/features/analytics/food/food-analytics-provider"
import { FoodAnalyticsDrillDownList } from "@/features/analytics/food/food-analytics-drilldown"
import { MediaAnalyticsKpiGrid } from "@/features/analytics/media/media-analytics-kpi-grid"
import {
  MediaAnalyticsBreakdownSections,
  MediaAnalyticsMonthlySections,
} from "@/features/analytics/media/media-analytics-sections"
import { MediaButton } from "@/features/media/media-button"
import { MediaScreenScrollView } from "@/features/media/primitives/media-screen-scroll-view"
import { MediaSurface } from "@/features/media/media-surface"
import { MEDIA_PRIMARY_TINT, MEDIA_PRIMARY_TINT_MUTED } from "@/features/media/media-ui"

export function FoodAnalyticsScreen() {
  const {
    activeFilterCount,
    breakdownSections,
    clearDrillDown,
    drillDown,
    drillDownEntries,
    drillDownGroups,
    error,
    filteredCount,
    hasActiveFilters,
    kpis,
    loading,
    monthlySections,
    refreshEntries,
    refreshing,
    resetFilters,
    selectChartItem,
    totalCount,
  } = useFoodAnalytics()

  function handleChartItemPress(sectionKey: string, item: { key: string; label: string }) {
    if (process.env.EXPO_OS === "ios") {
      void Haptics.selectionAsync()
    }

    selectChartItem(sectionKey, item)
  }

  return (
    <MediaScreenScrollView
      style={{ backgroundColor: PlatformColor("systemGroupedBackground") }}
      contentContainerStyle={{ gap: 16, paddingBottom: 42 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={MEDIA_PRIMARY_TINT}
          onRefresh={() => {
            void refreshEntries()
          }}
        />
      }
    >
      <MediaSurface gap={14}>
        <View style={{ gap: 6 }}>
          <Text selectable style={{ color: MEDIA_PRIMARY_TINT_MUTED, fontSize: 12, fontWeight: "700" }}>
            FOOD VIEW
          </Text>
          <Text selectable style={{ color: MEDIA_PRIMARY_TINT, fontSize: 24, fontWeight: "700" }}>
            {filteredCount === totalCount
              ? `${totalCount} logged visits`
              : `${filteredCount} of ${totalCount} logged visits`}
          </Text>
          <Text selectable style={{ color: MEDIA_PRIMARY_TINT_MUTED, fontSize: 14, lineHeight: 20 }}>
            {hasActiveFilters
              ? `${activeFilterCount} active filters are shaping the metrics below.`
              : "All imported food entries are included in the metrics below."}
          </Text>
        </View>
        {hasActiveFilters ? (
          <View style={{ flexDirection: "row", gap: 12 }}>
            <MediaButton label="Reset Filters" onPress={resetFilters} size="compact" variant="secondary" />
          </View>
        ) : null}
      </MediaSurface>

      {error ? (
        <MediaSurface gap={8}>
          <Text selectable style={{ color: "#991B1B", fontSize: 15, fontWeight: "700" }}>
            Analytics data may be stale
          </Text>
          <Text selectable style={{ color: MEDIA_PRIMARY_TINT_MUTED, fontSize: 14, lineHeight: 20 }}>
            {error}
          </Text>
        </MediaSurface>
      ) : null}

      {loading && totalCount === 0 ? (
        <MediaSurface gap={10}>
          <Text selectable style={{ color: MEDIA_PRIMARY_TINT, fontSize: 18, fontWeight: "700" }}>
            Loading food analytics
          </Text>
          <Text selectable style={{ color: MEDIA_PRIMARY_TINT_MUTED, fontSize: 14, lineHeight: 20 }}>
            Pulling visits, spend, and ratings from your food diary.
          </Text>
        </MediaSurface>
      ) : totalCount === 0 ? (
        <MediaSurface gap={10}>
          <Text selectable style={{ color: MEDIA_PRIMARY_TINT, fontSize: 18, fontWeight: "700" }}>
            No food entries yet
          </Text>
          <Text selectable style={{ color: MEDIA_PRIMARY_TINT_MUTED, fontSize: 14, lineHeight: 20 }}>
            Log a few meals in the Food tab and this dashboard will start surfacing visits, spending, and
            breakdowns automatically.
          </Text>
        </MediaSurface>
      ) : filteredCount === 0 ? (
        <MediaSurface gap={12}>
          <Text selectable style={{ color: MEDIA_PRIMARY_TINT, fontSize: 18, fontWeight: "700" }}>
            No matches for these filters
          </Text>
          <Text selectable style={{ color: MEDIA_PRIMARY_TINT_MUTED, fontSize: 14, lineHeight: 20 }}>
            Try widening the date range or clearing one of the active groups to bring visits back into the
            dashboard.
          </Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <MediaButton label="Reset Filters" onPress={resetFilters} size="compact" variant="primary" />
          </View>
        </MediaSurface>
      ) : drillDown ? (
        <FoodAnalyticsDrillDownList
          drillDown={drillDown}
          groups={drillDownGroups}
          onClear={clearDrillDown}
          onOpenEntry={(entryId) => router.push(`/food/entry/${entryId}`)}
          visitCount={drillDownEntries.length}
        />
      ) : (
        <>
          <MediaAnalyticsKpiGrid items={kpis} />
          <MediaAnalyticsMonthlySections onItemPress={handleChartItemPress} sections={monthlySections} />
          <MediaAnalyticsBreakdownSections onItemPress={handleChartItemPress} sections={breakdownSections} />
        </>
      )}
    </MediaScreenScrollView>
  )
}
