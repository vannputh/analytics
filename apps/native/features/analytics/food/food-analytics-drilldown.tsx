import { Pressable, Text, View } from "react-native"

import {
  DINING_OPTIONS,
  formatRestaurantDisplayName,
  type FoodAnalyticsDrillDown,
  type FoodAnalyticsPlaceGroup,
  type FoodEntry,
} from "@analytics/domain"

import { formatReadableDate } from "@/features/food/food-ui"
import { MediaButton } from "@/features/media/media-button"
import { MediaSurface } from "@/features/media/media-surface"
import { MEDIA_FORM_FILL, MEDIA_PRIMARY_TINT, MEDIA_PRIMARY_TINT_MUTED } from "@/features/media/media-ui"

function getDiningLabel(value: string | null | undefined) {
  return DINING_OPTIONS.find((option) => option.value === value)?.label ?? value ?? null
}

function formatVisitMeta(entry: FoodEntry) {
  return [
    formatReadableDate(entry.visit_date),
    getDiningLabel(entry.dining_type),
    typeof entry.overall_rating === "number" ? `${entry.overall_rating.toFixed(1)} / 5` : null,
    entry.city,
  ]
    .filter(Boolean)
    .join(" · ")
}

export function FoodAnalyticsDrillDownList({
  drillDown,
  groups,
  onClear,
  onOpenEntry,
  visitCount,
}: {
  drillDown: FoodAnalyticsDrillDown
  groups: FoodAnalyticsPlaceGroup[]
  onClear(): void
  onOpenEntry(entryId: string): void
  visitCount: number
}) {
  return (
    <View style={{ gap: 16 }}>
      <MediaSurface gap={14}>
        <View style={{ gap: 6 }}>
          <Text selectable style={{ color: MEDIA_PRIMARY_TINT_MUTED, fontSize: 12, fontWeight: "700" }}>
            DRILL-DOWN
          </Text>
          <Text selectable style={{ color: MEDIA_PRIMARY_TINT, fontSize: 24, fontWeight: "700" }}>
            {drillDown.label}
          </Text>
          <Text selectable style={{ color: MEDIA_PRIMARY_TINT_MUTED, fontSize: 14, lineHeight: 20 }}>
            {visitCount === 1 ? "1 matching visit" : `${visitCount} matching visits`}, grouped by place.
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <MediaButton label="Back" onPress={onClear} size="compact" variant="secondary" />
          <MediaButton label="Clear" onPress={onClear} size="compact" variant="chip" />
        </View>
      </MediaSurface>

      {groups.length === 0 ? (
        <MediaSurface gap={8}>
          <Text selectable style={{ color: MEDIA_PRIMARY_TINT, fontSize: 18, fontWeight: "700" }}>
            No matching visits
          </Text>
          <Text selectable style={{ color: MEDIA_PRIMARY_TINT_MUTED, fontSize: 14, lineHeight: 20 }}>
            This selection has no visits under the current filters.
          </Text>
        </MediaSurface>
      ) : (
        groups.map((group) => (
          <MediaSurface key={group.placeName} gap={12}>
            <View style={{ gap: 4 }}>
              <Text selectable style={{ color: MEDIA_PRIMARY_TINT, fontSize: 17, fontWeight: "700" }}>
                {group.placeName}
              </Text>
              <Text selectable style={{ color: MEDIA_PRIMARY_TINT_MUTED, fontSize: 13 }}>
                {group.entries.length === 1 ? "1 visit" : `${group.entries.length} visits`}
              </Text>
            </View>
            <View style={{ gap: 8 }}>
              {group.entries.map((entry) => (
                <Pressable
                  key={entry.id}
                  accessibilityRole="button"
                  onPress={() => onOpenEntry(entry.id)}
                  style={{
                    gap: 4,
                    borderRadius: 18,
                    borderCurve: "continuous",
                    backgroundColor: MEDIA_FORM_FILL,
                    padding: 14,
                  }}
                >
                  <Text selectable style={{ color: MEDIA_PRIMARY_TINT, fontSize: 15, fontWeight: "700" }}>
                    {formatRestaurantDisplayName(entry)}
                  </Text>
                  <Text selectable style={{ color: MEDIA_PRIMARY_TINT_MUTED, fontSize: 13, lineHeight: 18 }}>
                    {formatVisitMeta(entry)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </MediaSurface>
        ))
      )}
    </View>
  )
}
