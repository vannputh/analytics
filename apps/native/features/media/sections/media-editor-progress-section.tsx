import { View } from "react-native"

import type { MediaDraft } from "@analytics/domain"

import { MediaFormField } from "@/features/media/primitives/media-form-field"
import { MediaDateField } from "@/features/media/primitives/media-date-field"
import { MediaTextField } from "@/features/media/primitives/media-text-field"

export function MediaEditorProgressSection({
  draft,
  platformPlaceholder,
  onChangeEpisodes,
  onChangeEpisodesWatched,
  onChangeFinishDate,
  onChangeLastWatchedAt,
  onChangePlatform,
  onChangeSeason,
  onChangeStartDate,
}: {
  draft: MediaDraft
  platformPlaceholder: string
  onChangeEpisodes(value: string): void
  onChangeEpisodesWatched(value: string): void
  onChangeFinishDate(value: string | null): void
  onChangeLastWatchedAt(value: string | null): void
  onChangePlatform(value: string): void
  onChangeSeason(value: string): void
  onChangeStartDate(value: string | null): void
}) {
  return (
    <View style={{ gap: 16 }}>
      <MediaFormField label="Platform">
        <MediaTextField value={draft.platform ?? ""} onChangeText={onChangePlatform} placeholder={platformPlaceholder} />
      </MediaFormField>

      <MediaFormField label="Season">
        <MediaTextField value={draft.season ?? ""} onChangeText={onChangeSeason} placeholder="Season 1" />
      </MediaFormField>

      <MediaFormField label="Episodes">
        <MediaTextField keyboardType="numbers-and-punctuation" value={draft.episodes?.toString() ?? ""} onChangeText={onChangeEpisodes} placeholder="12" />
      </MediaFormField>

      <MediaFormField label="Episodes watched">
        <MediaTextField keyboardType="numbers-and-punctuation" value={draft.episodes_watched?.toString() ?? ""} onChangeText={onChangeEpisodesWatched} placeholder="0" />
      </MediaFormField>

      <MediaFormField label="Start date">
        <MediaDateField value={draft.start_date ?? null} onChange={onChangeStartDate} />
      </MediaFormField>

      <MediaFormField label="Finish date">
        <MediaDateField value={draft.finish_date ?? null} onChange={onChangeFinishDate} />
      </MediaFormField>

      <MediaFormField label="Last watched at">
        <MediaDateField value={draft.last_watched_at ?? null} onChange={onChangeLastWatchedAt} />
      </MediaFormField>
    </View>
  )
}
