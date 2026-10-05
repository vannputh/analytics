import { useEffect, useRef } from "react"
import type { MediaDiaryEntries, MediaEntry } from "@analytics/domain"
import { Animated, LayoutAnimation, View } from "react-native"

import { MediaHoldDroppedSection } from "@/features/media/media-hold-dropped-section"
import { MediaPlannedSection } from "@/features/media/media-planned-section"
import type { MediaDiaryArea, MediaDisplayPreferences } from "@/features/media/media-types"
import { MediaWatchedSection } from "@/features/media/media-watched-section"
import { MediaWatchingSection } from "@/features/media/media-watching-section"
import { MediaDiaryAreaSkeletonPanel } from "@/features/media/sections/media-diary-area-skeleton-panel"

export function MediaDiaryActiveAreaPanel({
  activeArea,
  diaryEntries,
  displayPreferences,
  loading,
  onIncrementWatching,
  onOpenEntry,
  watchedEntries,
}: {
  activeArea: MediaDiaryArea
  diaryEntries: MediaDiaryEntries
  displayPreferences: MediaDisplayPreferences
  loading: boolean
  onIncrementWatching(entryId: string): Promise<unknown>
  onOpenEntry(entryId: string): void
  watchedEntries: MediaEntry[]
}) {
  const pausedEntries = diaryEntries.holdAndDropped.filter((entry) => entry.status === "On Hold")
  const droppedEntries = diaryEntries.holdAndDropped.filter((entry) => entry.status === "Dropped")
  const transitionValue = useRef(new Animated.Value(1)).current

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    transitionValue.setValue(0)

    Animated.timing(transitionValue, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start()
  }, [activeArea, loading, transitionValue])

  const animatedStyle = {
    opacity: transitionValue,
    transform: [
      {
        translateY: transitionValue.interpolate({
          inputRange: [0, 1],
          outputRange: [10, 0],
        }),
      },
    ],
  }

  if (loading) {
    return (
      <Animated.View style={animatedStyle}>
        <MediaDiaryAreaSkeletonPanel activeArea={activeArea} />
      </Animated.View>
    )
  }

  return (
    <Animated.View style={[{ gap: 14 }, animatedStyle]}>
      {activeArea === "watching" ? (
        <MediaWatchingSection
          entries={diaryEntries.watching}
          loading={loading}
          onIncrement={(entryId) => onIncrementWatching(entryId)}
          onOpenEntry={onOpenEntry}
        />
      ) : null}

      {activeArea === "watched" ? (
        <MediaWatchedSection
          displayPreferences={displayPreferences}
          entries={watchedEntries}
          onOpenEntry={onOpenEntry}
        />
      ) : null}

      {activeArea === "planned" ? (
        <MediaPlannedSection
          entries={diaryEntries.planned}
          onOpenEntry={onOpenEntry}
        />
      ) : null}

      {activeArea === "paused" ? (
        <MediaHoldDroppedSection
          displayPreferences={displayPreferences}
          emptyLabel="No paused entries yet."
          entries={pausedEntries}
          onOpenEntry={onOpenEntry}
        />
      ) : null}

      {activeArea === "dropped" ? (
        <MediaHoldDroppedSection
          displayPreferences={displayPreferences}
          emptyLabel="No dropped entries yet."
          entries={droppedEntries}
          onOpenEntry={onOpenEntry}
        />
      ) : null}
    </Animated.View>
  )
}
