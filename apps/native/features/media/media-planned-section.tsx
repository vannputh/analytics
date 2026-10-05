import { View, Text, PlatformColor } from "react-native"

import type { MediaEntry } from "@analytics/domain"

import { MediaSurface } from "@/features/media/media-surface"
import { PlannedPosterGrid } from "@/features/media/planned-poster-grid"

export function MediaPlannedSection({
  entries,
  onOpenEntry,
}: {
  entries: MediaEntry[]
  onOpenEntry(entryId: string): void
}) {
  return (
    <View style={{ gap: 12 }}>
      {entries.length > 0 ? (
        <PlannedPosterGrid
          entries={entries}
          onOpenEntry={onOpenEntry}
        />
      ) : (
        <MediaSurface glass>
          <Text selectable style={{ fontSize: 14, lineHeight: 20, color: PlatformColor("secondaryLabel") }}>
            No planned entries yet.
          </Text>
        </MediaSurface>
      )}
    </View>
  )
}
