import { PlatformColor, Text, View } from "react-native"

import { formatDate, type MediaEntry } from "@analytics/domain"

import { MediaDetailSurface } from "@/features/media/components/media-detail-surface"
import type { MediaDisplayPreferences } from "@/features/media/media-types"

function SummaryRow({ label, value }: { label: string; value: string | null }) {
  if (!value) {
    return null
  }

  return (
    <View style={{ gap: 2 }}>
      <Text selectable style={{ fontSize: 12, fontWeight: "600", color: PlatformColor("secondaryLabel"), letterSpacing: 0.2 }}>
        {label}
      </Text>
      <Text selectable style={{ fontSize: 15, lineHeight: 22, color: PlatformColor("label") }}>
        {value}
      </Text>
    </View>
  )
}

export function MediaDetailSummarySection({
  displayPreferences,
  entry,
  timeTaken,
}: {
  displayPreferences: MediaDisplayPreferences
  entry: MediaEntry
  timeTaken: string | null
}) {
  return (
    <MediaDetailSurface>
      <Text selectable style={{ fontSize: 17, fontWeight: "600", color: PlatformColor("label") }}>
        Summary
      </Text>
      <SummaryRow label="Status" value={entry.status} />
      {displayPreferences.showDates ? (
        <>
          <SummaryRow label="Started" value={entry.start_date ? formatDate(entry.start_date) : null} />
          <SummaryRow label="watched" value={entry.finish_date ? formatDate(entry.finish_date) : null} />
          <SummaryRow label="Last watched" value={entry.last_watched_at ? formatDate(entry.last_watched_at) : null} />
        </>
      ) : null}
      {displayPreferences.showPlatform ? <SummaryRow label="Platform" value={entry.platform} /> : null}
      {displayPreferences.showMedium ? <SummaryRow label="Medium" value={entry.medium} /> : null}
      {displayPreferences.showType ? <SummaryRow label="Type" value={entry.type} /> : null}
      {displayPreferences.showLanguage ? (
        <SummaryRow
          label="Language"
          value={Array.isArray(entry.language) ? entry.language.join(", ") : entry.language ?? null}
        />
      ) : null}
      {displayPreferences.showTimeTaken ? <SummaryRow label="Time taken" value={timeTaken} /> : null}
      {displayPreferences.showAverageRating ? (
        <SummaryRow
          label="Ratings"
          value={
            [
              entry.my_rating ? `Mine ${entry.my_rating}` : null,
              entry.average_rating ? `Avg ${entry.average_rating}` : null,
            ]
              .filter(Boolean)
              .join(" • ") || null
          }
        />
      ) : null}
      <SummaryRow label="Genres" value={entry.genre?.join(", ") ?? null} />
      <SummaryRow label="IMDb ID" value={entry.imdb_id} />
    </MediaDetailSurface>
  )
}
