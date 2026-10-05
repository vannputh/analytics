import { PlatformColor, View, Text } from "react-native"

import type { MediaEntry } from "@analytics/domain"

import { MediaEntryCard } from "@/features/media/media-entry-card"
import { MediaSurface } from "@/features/media/media-surface"
import type { MediaDisplayPreferences } from "@/features/media/media-types"

export function MediaWatchedSection({
  displayPreferences,
  entries,
  onOpenEntry,
}: {
  displayPreferences: MediaDisplayPreferences
  entries: MediaEntry[]
  onOpenEntry(entryId: string): void
}) {
  return (
    <View style={{ gap: 12 }}>
      {entries.length > 0 ? (
        entries.map((entry) => (
          <MediaEntryCard
            key={entry.id}
            displayPreferences={displayPreferences}
            entry={entry}
            onOpenEntry={onOpenEntry}
          />
        ))
      ) : (
        <MediaSurface glass>
          <Text selectable style={{ fontSize: 14, lineHeight: 20, color: PlatformColor("secondaryLabel") }}>
            No watched entries match the current filters.
          </Text>
        </MediaSurface>
      )}
    </View>
  )
}
