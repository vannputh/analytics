import type { ReactNode } from "react"
import { View } from "react-native"

import type { MediaDraft } from "@analytics/domain"

import { MediaActionButton } from "@/features/media/primitives/media-action-button"
import { MediaFormField } from "@/features/media/primitives/media-form-field"
import { MediaTextField } from "@/features/media/primitives/media-text-field"

export function MediaEditorMetadataSection({
  children,
  draft,
  metadataLoading,
  onChangeImdbId,
  onChangePosterUrl,
  onFetchOmdb,
  onFetchTmdb,
  onUploadPoster,
}: {
  children?: ReactNode
  draft: MediaDraft
  metadataLoading: boolean
  onChangeImdbId(value: string): void
  onChangePosterUrl(value: string): void
  onFetchOmdb(): void
  onFetchTmdb(): void
  onUploadPoster(): void
}) {
  return (
    <View style={{ gap: 16 }}>
      <MediaFormField label="IMDb ID">
        <MediaTextField
          autoCapitalize="none"
          value={draft.imdb_id ?? ""}
          onChangeText={onChangeImdbId}
          placeholder="tt1234567"
        />
      </MediaFormField>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <MediaActionButton
          label={metadataLoading ? "Loading…" : "Fetch TMDB"}
          onPress={onFetchTmdb}
          style={{ flex: 1 }}
          variant="solid"
        />
        <MediaActionButton
          label={metadataLoading ? "Loading…" : "Fetch OMDB"}
          onPress={onFetchOmdb}
          style={{ flex: 1 }}
          variant="muted"
        />
      </View>

      <MediaFormField label="Poster URL">
        <MediaTextField
          autoCapitalize="none"
          value={draft.poster_url ?? ""}
          onChangeText={onChangePosterUrl}
          placeholder="https://..."
        />
      </MediaFormField>

      <MediaActionButton label="Pick and upload poster" onPress={onUploadPoster} variant="glass" />
      {children}
    </View>
  )
}
