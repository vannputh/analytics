import type { MediaEntry } from "@analytics/domain"
import { PlatformColor, Text, View } from "react-native"

import { MediaHoldDroppedSection } from "@/features/media/media-hold-dropped-section"
import { MediaPlannedSection } from "@/features/media/media-planned-section"
import { MediaSurface } from "@/features/media/media-surface"
import type { MediaDisplayPreferences } from "@/features/media/media-types"
import { MediaPill } from "@/features/media/primitives/media-pill"

export function MediaBacklogSection({
  displayPreferences,
  holdAndDroppedEntries,
  onOpenEntry,
  plannedEntries,
}: {
  displayPreferences: MediaDisplayPreferences
  holdAndDroppedEntries: MediaEntry[]
  onOpenEntry(entryId: string): void
  plannedEntries: MediaEntry[]
}) {
  const hasPlanned = plannedEntries.length > 0
  const hasPaused = holdAndDroppedEntries.length > 0

  if (!hasPlanned && !hasPaused) {
    return (
      <MediaSurface glass>
        <Text selectable style={{ fontSize: 14, lineHeight: 20, color: PlatformColor("secondaryLabel") }}>
          No queued, paused, or dropped entries yet.
        </Text>
      </MediaSurface>
    )
  }

  return (
    <View style={{ gap: 18 }}>
      {hasPlanned ? (
        <View style={{ gap: 10 }}>
          <MediaPill label="Up Next" muted />
          <MediaPlannedSection entries={plannedEntries} onOpenEntry={onOpenEntry} />
        </View>
      ) : null}

      {hasPaused ? (
        <View style={{ gap: 10 }}>
          <MediaPill label="Paused & Dropped" muted />
          <MediaHoldDroppedSection
            displayPreferences={displayPreferences}
            entries={holdAndDroppedEntries}
            onOpenEntry={onOpenEntry}
          />
        </View>
      ) : null}
    </View>
  )
}
