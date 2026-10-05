import { View } from "react-native"

import type { MediaDraft } from "@analytics/domain"

import { MediaFormField } from "@/features/media/primitives/media-form-field"
import { MediaTextField } from "@/features/media/primitives/media-text-field"

export function MediaEditorRatingsSection({
  draft,
  languagePlaceholder,
  onChangeAverageRating,
  onChangeGenres,
  onChangeLanguage,
  onChangeLength,
  onChangeMyRating,
  onChangePrice,
}: {
  draft: MediaDraft
  languagePlaceholder: string
  onChangeAverageRating(value: string): void
  onChangeGenres(value: string): void
  onChangeLanguage(value: string): void
  onChangeLength(value: string): void
  onChangeMyRating(value: string): void
  onChangePrice(value: string): void
}) {
  return (
    <View style={{ gap: 16 }}>
      <MediaFormField label="My rating">
        <MediaTextField keyboardType="numbers-and-punctuation" value={draft.my_rating?.toString() ?? ""} onChangeText={onChangeMyRating} placeholder="8.5" />
      </MediaFormField>

      <MediaFormField label="Average rating">
        <MediaTextField keyboardType="numbers-and-punctuation" value={draft.average_rating?.toString() ?? ""} onChangeText={onChangeAverageRating} placeholder="8.2" />
      </MediaFormField>

      <MediaFormField label="Length">
        <MediaTextField value={draft.length ?? ""} onChangeText={onChangeLength} placeholder="2h 10m" />
      </MediaFormField>

      <MediaFormField label="Price">
        <MediaTextField keyboardType="numbers-and-punctuation" value={draft.price?.toString() ?? ""} onChangeText={onChangePrice} placeholder="0" />
      </MediaFormField>

      <MediaFormField label="Language">
        <MediaTextField value={Array.isArray(draft.language) ? draft.language.join(", ") : ""} onChangeText={onChangeLanguage} placeholder={languagePlaceholder} />
      </MediaFormField>

      <MediaFormField label="Genres">
        <MediaTextField value={Array.isArray(draft.genre) ? draft.genre.join(", ") : ""} onChangeText={onChangeGenres} placeholder="Drama, Mystery" />
      </MediaFormField>
    </View>
  )
}
