import { PlatformColor, Text, View } from "react-native"

import { Image } from "expo-image"

import {
  STATUS_OPTIONS,
  TYPE_OPTIONS,
  MEDIUM_OPTIONS,
  getPlaceholderPoster,
  type MediaDraft,
} from "@analytics/domain"

import { AdaptiveGlass } from "@/components/adaptive-glass"
import { MediaChoiceRow } from "@/features/media/components/media-choice-row"
import { MediaFormField } from "@/features/media/primitives/media-form-field"
import { MediaSurface } from "@/features/media/media-surface"

function PosterPreview({ draft }: { draft: MediaDraft }) {
  if (draft.poster_url) {
    return (
      <Image
        source={draft.poster_url}
        style={{
          width: 74,
          height: 104,
          borderRadius: 20,
        }}
        contentFit="cover"
      />
    )
  }

  return (
    <AdaptiveGlass
      style={{
        width: 74,
        height: 104,
        borderRadius: 20,
        borderCurve: "continuous",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: 34 }}>{getPlaceholderPoster(draft.type ?? draft.medium ?? null)}</Text>
    </AdaptiveGlass>
  )
}

export function MediaEditorCoreDetailsSection({
  compact = false,
  draft,
  selectedSourceLabel,
  onSelectMedium,
  onSelectStatus,
  onSelectType,
}: {
  compact?: boolean
  draft: MediaDraft
  selectedSourceLabel: string | null
  onSelectMedium(value: string): void
  onSelectStatus(value: string): void
  onSelectType(value: string): void
}) {
  return (
    <MediaSurface gap={compact ? 14 : 16}>
      <View style={{ gap: compact ? 4 : 6 }}>
        <Text style={{ fontSize: 17, fontWeight: "700", color: PlatformColor("label") }}>
          Core details
        </Text>
        <Text style={{ fontSize: 13, lineHeight: 18, color: PlatformColor("secondaryLabel") }}>
          Keep this focused: confirm the essentials, then save. Everything else stays below.
        </Text>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <PosterPreview draft={draft} />

        <View style={{ flex: 1, gap: 4 }}>
          <Text numberOfLines={2} style={{ fontSize: 18, fontWeight: "700", color: PlatformColor("label") }}>
            {draft.title?.trim() || "Untitled draft"}
          </Text>
          <Text style={{ fontSize: 13, color: PlatformColor("secondaryLabel") }}>
            {[draft.medium, draft.type, draft.status].filter(Boolean).join(" • ") || "Pick the essentials and save fast."}
          </Text>
          {selectedSourceLabel ? (
            <Text style={{ fontSize: 12, fontWeight: "600", color: PlatformColor("secondaryLabel") }}>
              {selectedSourceLabel}
            </Text>
          ) : null}
        </View>
      </View>

      <MediaFormField label="Status">
        <MediaChoiceRow options={STATUS_OPTIONS} value={draft.status ?? null} onSelect={onSelectStatus} />
      </MediaFormField>

      <MediaFormField label="Medium">
        <MediaChoiceRow options={MEDIUM_OPTIONS} value={draft.medium ?? null} onSelect={onSelectMedium} />
      </MediaFormField>

      <MediaFormField label="Type">
        <MediaChoiceRow options={TYPE_OPTIONS} value={draft.type ?? null} onSelect={onSelectType} />
      </MediaFormField>
    </MediaSurface>
  )
}
