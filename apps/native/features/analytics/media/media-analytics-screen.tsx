import { PlatformColor, RefreshControl, Text, View, useWindowDimensions } from "react-native"

import { MediaButton } from "@/features/media/media-button"
import { MediaScreenScrollView } from "@/features/media/primitives/media-screen-scroll-view"
import { MediaSurface } from "@/features/media/media-surface"
import {
  MEDIA_FORM_FILL,
  MEDIA_HAIRLINE,
  MEDIA_PRIMARY_TINT,
  MEDIA_PRIMARY_TINT_MUTED,
} from "@/features/media/media-ui"
import { useMediaAnalytics } from "@/features/analytics/media/media-analytics-provider"
import { MediaAnalyticsKpiGrid } from "@/features/analytics/media/media-analytics-kpi-grid"
import {
  MediaAnalyticsBreakdownSections,
  MediaAnalyticsMonthlySections,
} from "@/features/analytics/media/media-analytics-sections"

export function MediaAnalyticsScreen() {
  const {
    activeFilterCount,
    breakdownSections,
    error,
    filteredCount,
    hasActiveFilters,
    kpis,
    loading,
    monthlySections,
    refreshEntries,
    refreshing,
    resetFilters,
    totalCount,
  } = useMediaAnalytics()

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
            SESSION VIEW
          </Text>
          <Text selectable style={{ color: MEDIA_PRIMARY_TINT, fontSize: 24, fontWeight: "700" }}>
            {filteredCount === totalCount
              ? `${totalCount} tracked items`
              : `${filteredCount} of ${totalCount} tracked items`}
          </Text>
          <Text selectable style={{ color: MEDIA_PRIMARY_TINT_MUTED, fontSize: 14, lineHeight: 20 }}>
            {hasActiveFilters
              ? `${activeFilterCount} active filters are shaping the metrics below.`
              : "All imported media entries are included in the metrics below."}
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
        <MediaAnalyticsLoadingState />
      ) : totalCount === 0 ? (
        <MediaSurface gap={10}>
          <Text selectable style={{ color: MEDIA_PRIMARY_TINT, fontSize: 18, fontWeight: "700" }}>
            No media entries yet
          </Text>
          <Text selectable style={{ color: MEDIA_PRIMARY_TINT_MUTED, fontSize: 14, lineHeight: 20 }}>
            Add a few movies or shows in the Media tab and this dashboard will start surfacing watch time,
            spending, and breakdowns automatically.
          </Text>
        </MediaSurface>
      ) : filteredCount === 0 ? (
        <MediaSurface gap={12}>
          <Text selectable style={{ color: MEDIA_PRIMARY_TINT, fontSize: 18, fontWeight: "700" }}>
            No matches for these filters
          </Text>
          <Text selectable style={{ color: MEDIA_PRIMARY_TINT_MUTED, fontSize: 14, lineHeight: 20 }}>
            Try widening the date range or clearing one of the active groups to bring entries back into the
            dashboard.
          </Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <MediaButton label="Reset Filters" onPress={resetFilters} size="compact" variant="primary" />
          </View>
        </MediaSurface>
      ) : (
        <>
          <MediaAnalyticsKpiGrid items={kpis} />
          <MediaAnalyticsMonthlySections sections={monthlySections} />
          <MediaAnalyticsBreakdownSections sections={breakdownSections} />
        </>
      )}
    </MediaScreenScrollView>
  )
}

function MediaAnalyticsLoadingState() {
  const { width } = useWindowDimensions()
  const compact = width < 380

  return (
    <View style={{ gap: 12 }}>
      <MediaSurface gap={12}>
        <View
          style={{
            height: 14,
            width: "34%",
            borderRadius: 999,
            backgroundColor: MEDIA_FORM_FILL,
          }}
        />
        <View
          style={{
            height: 26,
            width: "72%",
            borderRadius: 999,
            backgroundColor: MEDIA_FORM_FILL,
          }}
        />
        <View
          style={{
            height: 12,
            width: "88%",
            borderRadius: 999,
            backgroundColor: MEDIA_FORM_FILL,
          }}
        />
      </MediaSurface>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {Array.from({ length: 4 }).map((_, index) => (
          <MediaSurface
            key={index}
            gap={12}
            style={{ flexBasis: compact ? "100%" : "48%", flexGrow: 1, minWidth: 0 }}
          >
            <View
              style={{
                height: 12,
                width: "48%",
                borderRadius: 999,
                backgroundColor: MEDIA_FORM_FILL,
              }}
            />
            <View
              style={{
                height: 24,
                width: "68%",
                borderRadius: 999,
                backgroundColor: MEDIA_FORM_FILL,
              }}
            />
            <View
              style={{
                height: 10,
                width: "56%",
                borderRadius: 999,
                backgroundColor: MEDIA_FORM_FILL,
              }}
            />
          </MediaSurface>
        ))}
      </View>

      <MediaSurface gap={14}>
        <View
          style={{
            height: 16,
            width: "44%",
            borderRadius: 999,
            backgroundColor: MEDIA_FORM_FILL,
          }}
        />
        <View style={{ flexDirection: "row", gap: 10 }}>
          {Array.from({ length: 4 }).map((_, index) => (
            <View key={index} style={{ width: 70, gap: 8 }}>
              <View
                style={{
                  height: 12,
                  width: "80%",
                  borderRadius: 999,
                  backgroundColor: MEDIA_FORM_FILL,
                }}
              />
              <View
                style={{
                  height: 132,
                  borderRadius: 18,
                  borderCurve: "continuous",
                  backgroundColor: MEDIA_FORM_FILL,
                  overflow: "hidden",
                  justifyContent: "flex-end",
                  padding: 8,
                }}
              >
                <View
                  style={{
                    height: 44 + index * 12,
                    borderRadius: 12,
                    borderCurve: "continuous",
                    backgroundColor: MEDIA_HAIRLINE,
                  }}
                />
              </View>
            </View>
          ))}
        </View>
      </MediaSurface>
    </View>
  )
}
