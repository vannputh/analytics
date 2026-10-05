import { useCallback } from "react"
import { Platform, PlatformColor, RefreshControl, Text, View, useWindowDimensions } from "react-native"

import * as Haptics from "expo-haptics"
import { router } from "expo-router"

import { FoodDayCell } from "@/features/food/food-day-cell"
import { FoodEntryCard } from "@/features/food/food-entry-card"
import { useFoodDiary } from "@/features/food/food-diary-provider"
import { FOOD_WEEKDAYS, formatLocalDateKey, formatReadableDate } from "@/features/food/food-ui"
import { MediaButton, MediaIconButton } from "@/features/media/media-button"
import { MediaEmptyState } from "@/features/media/primitives/media-empty-state"
import { MediaScreenScrollView } from "@/features/media/primitives/media-screen-scroll-view"
import { MediaSurface } from "@/features/media/media-surface"
import { MEDIA_HAIRLINE, MEDIA_PRIMARY_TINT, MEDIA_PRIMARY_TINT_MUTED } from "@/features/media/media-ui"

export function FoodDiaryScreen() {
  const { width } = useWindowDimensions()
  const {
    calendarDays,
    entriesByDate,
    error,
    goToNextMonth,
    goToPreviousMonth,
    goToToday,
    loading,
    refreshMonth,
    refreshing,
    selectedDate,
    selectedEntries,
    toggleSelectedDate,
  } = useFoodDiary()

  const addDate = selectedDate ?? formatLocalDateKey()
  const compact = width < 380
  const openEntry = useCallback((entryId: string) => {
    router.push(`/food/entry/${entryId}`)
  }, [])

  function handleSelectDate(nextDate: string) {
    if (process.env.EXPO_OS === "ios") {
      void Haptics.selectionAsync()
    }

    toggleSelectedDate(nextDate)
  }

  return (
    <MediaScreenScrollView
      style={{ backgroundColor: PlatformColor("systemGroupedBackground") }}
      contentContainerStyle={{ paddingBottom: 42, gap: 20 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={MEDIA_PRIMARY_TINT}
          onRefresh={() => {
            void refreshMonth({ silent: true })
          }}
        />
      }
    >
      <MediaSurface gap={compact ? 10 : 12} padding={compact ? 12 : 16}>
        {Platform.OS !== "ios" ? (
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <MediaIconButton
                accessibilityLabel="Previous month"
                icon="chevron.left"
                onPress={goToPreviousMonth}
                variant="secondary"
              />
              <MediaIconButton
                accessibilityLabel="Next month"
                icon="chevron.right"
                onPress={goToNextMonth}
                variant="secondary"
              />
            </View>
            <MediaButton label="Today" onPress={goToToday} size="compact" variant="secondary" />
          </View>
        ) : null}

        <View style={{ flexDirection: "row" }}>
          {FOOD_WEEKDAYS.map((day) => (
            <View key={day} style={{ flex: 1, alignItems: "center" }}>
              <Text
                selectable
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  letterSpacing: 0.4,
                  color: MEDIA_PRIMARY_TINT_MUTED,
                }}
              >
                {day}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {calendarDays.map((day) => (
            <View key={day.date} style={{ width: "14.2857%" }}>
              <FoodDayCell
                compact={compact}
                count={entriesByDate[day.date]?.length ?? 0}
                day={day.day}
                isCurrentMonth={day.isCurrentMonth}
                isSelected={selectedDate === day.date}
                isToday={day.isToday}
                onPress={() => handleSelectDate(day.date)}
              />
            </View>
          ))}
        </View>
      </MediaSurface>

      {error ? (
        <MediaEmptyState body={error} title="Unable to load food entries" />
      ) : null}

      <MediaSurface gap={0} padding={0}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            paddingHorizontal: 18,
            paddingTop: 16,
            paddingBottom: 12,
          }}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Text selectable style={{ fontSize: 12, fontWeight: "700", color: MEDIA_PRIMARY_TINT_MUTED }}>
              {selectedDate ? "Selected Day" : "Choose a Day"}
            </Text>
            <Text
              selectable
              numberOfLines={2}
              style={{ fontSize: compact ? 17 : 18, fontWeight: "700", color: MEDIA_PRIMARY_TINT }}
            >
              {selectedDate ? formatReadableDate(selectedDate) : "Tap a date to review visits"}
            </Text>
          </View>
          <MediaButton
            label="Add"
            onPress={() => router.push({ pathname: "/food/add", params: { date: addDate } })}
            size="compact"
            variant="primary"
          />
        </View>

        <View style={{ height: 1, backgroundColor: MEDIA_HAIRLINE, marginHorizontal: 18 }} />

        {loading && selectedEntries.length === 0 ? (
          <View style={{ paddingHorizontal: 18, paddingVertical: 18 }}>
            <Text selectable style={{ fontSize: 14, color: MEDIA_PRIMARY_TINT_MUTED }}>
              Loading entries…
            </Text>
          </View>
        ) : !selectedDate ? (
          <View style={{ paddingHorizontal: 18, paddingVertical: 18 }}>
            <Text selectable style={{ fontSize: 14, lineHeight: 20, color: MEDIA_PRIMARY_TINT_MUTED }}>
              Tap a date above to see visits and quick-add for that day.
            </Text>
          </View>
        ) : selectedEntries.length === 0 ? (
          <View style={{ paddingHorizontal: 18, paddingVertical: 18, gap: 6 }}>
            <Text selectable style={{ fontSize: 15, fontWeight: "700", color: MEDIA_PRIMARY_TINT }}>
              No visits logged
            </Text>
            <Text selectable style={{ fontSize: 14, lineHeight: 20, color: MEDIA_PRIMARY_TINT_MUTED }}>
              Start with a place name and date. Details can wait until later.
            </Text>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 18, paddingVertical: 4 }}>
            {selectedEntries.map((entry, index) => (
              <View
                key={entry.id}
                style={{
                  borderTopWidth: index === 0 ? 0 : 1,
                  borderTopColor: MEDIA_HAIRLINE,
                }}
              >
                <FoodEntryCard entry={entry} onPress={openEntry} />
              </View>
            ))}
          </View>
        )}
      </MediaSurface>
    </MediaScreenScrollView>
  )
}
