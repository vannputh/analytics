import type { RefObject } from "react"
import { ActivityIndicator, PlatformColor, Text, TextInput, View } from "react-native"

import {
  type MediaDraft,
} from "@analytics/domain"

import { MediaButton } from "@/features/media/media-button"
import type { MediaEditorStatusFeedback } from "@/features/media/media-editor-ux"
import { MediaEditorSearchResultRow } from "@/features/media/media-editor-search-result-row"
import { MediaFormField } from "@/features/media/primitives/media-form-field"
import { createMediaSearchListItemFromMetadataResult } from "@/features/media/media-search-list-item"
import { MediaTextField } from "@/features/media/primitives/media-text-field"
import { MediaSurface } from "@/features/media/media-surface"
import type { MetadataSearchResult, MetadataSearchSource } from "@/features/media/media-types"
import { MEDIA_FORM_FILL, MEDIA_PRIMARY_TINT } from "@/features/media/media-ui"

export function MediaEditorCoreSection({
  compact = false,
  draft,
  feedback,
  onChangeSelection,
  onChangeTitle,
  onSearchResultPress,
  searchError,
  searchLoading,
  searchResults,
  selectedSource,
  titleInputRef,
}: {
  compact?: boolean
  draft: MediaDraft
  feedback: MediaEditorStatusFeedback | null
  onChangeSelection(): void
  onChangeTitle(value: string): void
  onSearchResultPress(result: MetadataSearchResult): void
  searchError: string | null
  searchLoading: boolean
  searchResults: MetadataSearchResult[]
  selectedSource: MetadataSearchSource | null
  titleInputRef: RefObject<TextInput | null>
}) {
  return (
    <MediaSurface gap={compact ? 14 : 16}>
      <View style={{ gap: compact ? 4 : 6 }}>
        <Text style={{ fontSize: 17, fontWeight: "700", color: PlatformColor("label") }}>
          Quick Add
        </Text>
        {!compact ? (
          <Text style={{ fontSize: 13, lineHeight: 18, color: PlatformColor("secondaryLabel") }}>
            Start with the title. Pick a match if you want metadata to fill in the rest.
          </Text>
        ) : null}
      </View>

      <MediaFormField label="Title">
        <MediaTextField
          autoCapitalize="sentences"
          ref={titleInputRef}
          returnKeyType="done"
          value={draft.title}
          onChangeText={onChangeTitle}
          placeholder="Movie or show title"
        />
        {searchLoading ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <ActivityIndicator color={MEDIA_PRIMARY_TINT} />
            <Text style={{ fontSize: 13, color: PlatformColor("secondaryLabel") }}>
              Looking up matches…
            </Text>
          </View>
        ) : null}
        {searchError ? (
          <View
            style={{
              borderRadius: 16,
              borderCurve: "continuous",
              backgroundColor: "rgba(185, 28, 28, 0.08)",
              paddingHorizontal: 14,
              paddingVertical: 12,
            }}
          >
            <Text style={{ fontSize: 13, lineHeight: 18, color: "#991B1B" }}>
              {searchError}
            </Text>
          </View>
        ) : null}
        {feedback ? (
          <View
            style={{
              borderRadius: 16,
              borderCurve: "continuous",
              backgroundColor:
                feedback.tone === "success"
                  ? "rgba(17, 24, 39, 0.06)"
                  : feedback.tone === "warning"
                    ? "rgba(120, 53, 15, 0.08)"
                    : feedback.tone === "error"
                      ? "rgba(185, 28, 28, 0.08)"
                      : MEDIA_FORM_FILL,
              paddingHorizontal: 14,
              paddingVertical: 12,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <Text
                style={{
                  flex: 1,
                  fontSize: 13,
                  lineHeight: 18,
                  color:
                    feedback.tone === "error"
                      ? "#991B1B"
                      : feedback.tone === "warning"
                        ? "#92400E"
                        : "#111111",
                }}
              >
                {feedback.message}
              </Text>
              {selectedSource ? (
                <MediaButton
                  label="Change"
                  onPress={onChangeSelection}
                  size="compact"
                  variant="secondary"
                />
              ) : null}
            </View>
          </View>
        ) : null}
        {searchResults.length > 0 ? (
          <View style={{ gap: 10 }}>
            {searchResults.map((result) => (
              <MediaEditorSearchResultRow
                key={result.id}
                item={createMediaSearchListItemFromMetadataResult(result)}
                onPress={() => onSearchResultPress(result)}
              />
            ))}
          </View>
        ) : null}
      </MediaFormField>
    </MediaSurface>
  )
}
