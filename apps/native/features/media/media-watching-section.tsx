import type { MediaEntry } from "@analytics/domain"

import { WatchingStrip } from "@/features/media/watching-strip"

export function MediaWatchingSection({
  entries,
  loading,
  onIncrement,
  onOpenEntry,
}: {
  entries: MediaEntry[]
  loading: boolean
  onIncrement(entryId: string): Promise<unknown>
  onOpenEntry(entryId: string): void
}) {
  return (
    <WatchingStrip
      entries={entries}
      loading={loading}
      onIncrement={onIncrement}
      onOpenEntry={onOpenEntry}
    />
  )
}
