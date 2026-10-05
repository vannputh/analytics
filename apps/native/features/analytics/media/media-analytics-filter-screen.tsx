import { useState } from "react"
import { Pressable, ScrollView, Text, View } from "react-native"

import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker"

import { router } from "expo-router"

import { MediaButton } from "@/features/media/media-button"
import {
  formatMediaDateKey,
  formatMediaDateLabel,
  parseMediaDateKey,
} from "@/features/media/media-date"
import { MediaSurface } from "@/features/media/media-surface"
import {
  MEDIA_HAIRLINE,
  MEDIA_PRIMARY_TINT,
  MEDIA_PRIMARY_TINT_MUTED,
  MEDIA_SHEET_BACKGROUND,
} from "@/features/media/media-ui"
import { useMediaAnalytics } from "@/features/analytics/media/media-analytics-provider"
import {
  MEDIA_ANALYTICS_FILTER_GROUPS,
  summarizeMediaAnalyticsFilterGroupSelection,
} from "@/features/analytics/media/media-analytics-state"

export function MediaAnalyticsFilterScreen() {
  const { filterOptions, filters, resetFilters, setFilters } = useMediaAnalytics()
  const [openDateField, setOpenDateField] = useState<"dateFrom" | "dateTo" | null>(null)

  function updateDateField(key: "dateFrom" | "dateTo", value: string | null) {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }))
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: MEDIA_SHEET_BACKGROUND }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 20, gap: 24, paddingBottom: 32 }}
    >
      <MediaSurface gap={0} padding={0}>
        <FilterDateRow
          active={openDateField === "dateFrom"}
          label="From"
          value={filters.dateFrom}
          onChange={(value) => updateDateField("dateFrom", value)}
          onToggle={() => setOpenDateField((current) => (current === "dateFrom" ? null : "dateFrom"))}
        />
        <FilterDateRow
          active={openDateField === "dateTo"}
          label="To"
          value={filters.dateTo}
          onChange={(value) => updateDateField("dateTo", value)}
          onToggle={() => setOpenDateField((current) => (current === "dateTo" ? null : "dateTo"))}
        />
      </MediaSurface>

      <MediaSurface gap={0} padding={0}>
        {MEDIA_ANALYTICS_FILTER_GROUPS.map((group, index) => {
          const availableValues = filterOptions[group.key]
          const summary =
            availableValues.length === 0 && filters[group.key].length === 0
              ? "No options yet"
              : summarizeMediaAnalyticsFilterGroupSelection(filters, group.key)

          return (
            <FilterSummaryRow
              key={group.key}
              label={group.title}
              showBorder={index < MEDIA_ANALYTICS_FILTER_GROUPS.length - 1}
              summary={summary}
              onPress={() => router.push(`/insights/filters/${group.key}` as `/insights/filters/${string}`)}
            />
          )
        })}
      </MediaSurface>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <MediaButton label="Reset" onPress={resetFilters} style={{ flex: 1 }} variant="secondary" />
        <MediaButton label="Done" onPress={() => router.back()} style={{ flex: 1 }} variant="primary" />
      </View>
    </ScrollView>
  )
}

function FilterSummaryRow({
  label,
  onPress,
  showBorder = true,
  summary,
}: {
  label: string
  onPress(): void
  showBorder?: boolean
  summary: string
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        minHeight: 56,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderBottomWidth: showBorder ? 1 : 0,
        borderBottomColor: MEDIA_HAIRLINE,
      }}
    >
      <Text selectable style={{ flex: 1, fontSize: 16, color: MEDIA_PRIMARY_TINT }}>
        {label}
      </Text>
      <Text
        selectable
        numberOfLines={1}
        style={{ maxWidth: "50%", fontSize: 14, color: MEDIA_PRIMARY_TINT_MUTED }}
      >
        {summary}
      </Text>
    </Pressable>
  )
}

function FilterDateRow({
  active,
  label,
  onChange,
  onToggle,
  value,
}: {
  active: boolean
  label: string
  onChange(value: string | null): void
  onToggle(): void
  value: string | null
}) {
  function handleChange(event: DateTimePickerEvent, nextDate?: Date) {
    if (process.env.EXPO_OS !== "ios") {
      onToggle()
    }

    if (event.type === "dismissed") {
      return
    }

    if (nextDate) {
      onChange(formatMediaDateKey(nextDate))
    }
  }

  return (
    <View style={{ borderBottomWidth: label === "From" ? 1 : 0, borderBottomColor: MEDIA_HAIRLINE }}>
      <Pressable
        accessibilityRole="button"
        onPress={onToggle}
        style={{
          minHeight: 56,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          paddingHorizontal: 18,
          paddingVertical: 14,
        }}
      >
        <Text selectable style={{ fontSize: 16, color: MEDIA_PRIMARY_TINT }}>
          {label}
        </Text>
        <Text selectable style={{ fontSize: 14, color: MEDIA_PRIMARY_TINT_MUTED }}>
          {formatMediaDateLabel(value)}
        </Text>
      </Pressable>

      {active ? (
        <View style={{ paddingHorizontal: 12, paddingBottom: 12, gap: 10 }}>
          <DateTimePicker
            display={process.env.EXPO_OS === "ios" ? "inline" : "default"}
            mode="date"
            onChange={handleChange}
            value={parseMediaDateKey(value)}
          />
          {value ? (
            <MediaButton label="Clear Date" onPress={() => onChange(null)} size="compact" variant="secondary" />
          ) : null}
        </View>
      ) : null}
    </View>
  )
}
