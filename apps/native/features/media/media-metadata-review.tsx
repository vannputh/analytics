import { PlatformColor, StyleSheet, Text, View } from "react-native"

import type { MediaMetadata, MediaMetadataOverrideField } from "@analytics/domain"

import { MediaButton } from "@/features/media/media-button"

function formatMetadataValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.join(", ")
  }

  if (value === null || value === undefined || value === "") {
    return "Empty"
  }

  return String(value)
}

function formatFieldLabel(field: string) {
  return field
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function MediaMetadataReview({
  conflictFields,
  onApply,
  onDiscard,
  onToggleField,
  overrideFields,
  pendingMetadata,
}: {
  conflictFields: MediaMetadataOverrideField[]
  onApply(): void
  onDiscard(): void
  onToggleField(field: MediaMetadataOverrideField): void
  overrideFields: MediaMetadataOverrideField[]
  pendingMetadata: MediaMetadata | null
}) {
  if (!pendingMetadata || conflictFields.length === 0) {
    return null
  }

  return (
    <View
      style={{
        gap: 14,
        padding: 18,
        borderRadius: 20,
        borderCurve: "continuous",
        backgroundColor: PlatformColor("secondarySystemGroupedBackground"),
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: PlatformColor("separator"),
      }}
    >
      <View style={{ gap: 4 }}>
        <Text selectable style={{ fontSize: 17, fontWeight: "600", color: PlatformColor("label") }}>
          Review metadata changes
        </Text>
        <Text selectable style={{ fontSize: 15, lineHeight: 22, color: PlatformColor("secondaryLabel") }}>
          Select the fetched fields you want to overwrite.
        </Text>
      </View>

      <View style={{ gap: 10 }}>
        {conflictFields.map((field) => {
          const active = overrideFields.includes(field)

          return (
            <MediaButton
              key={field}
              align="leading"
              detail={formatMetadataValue(pendingMetadata[field])}
              label={formatFieldLabel(field)}
              onPress={() => onToggleField(field)}
              selected={active}
              variant="chip"
            />
          )
        })}
      </View>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <MediaButton label="Discard" onPress={onDiscard} style={{ flex: 1 }} variant="secondary" />
        <MediaButton label="Apply" onPress={onApply} style={{ flex: 1 }} variant="primary" />
      </View>
    </View>
  )
}
