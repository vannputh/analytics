import { Text, View } from "react-native"

import { MediaSurface } from "@/features/media/media-surface"
import type { MediaEditorFeedbackTone } from "@/features/media/media-editor-ux"
import { MediaActionButton } from "@/features/media/primitives/media-action-button"

export function MediaEditorFooterActions({
  compact = false,
  disabled = false,
  mode,
  onCancel,
  onSave,
  saving,
  statusMessage,
  statusTone = "neutral",
}: {
  compact?: boolean
  disabled?: boolean
  mode: "create" | "edit"
  onCancel(): void
  onSave(): void
  saving: boolean
  statusMessage: string
  statusTone?: MediaEditorFeedbackTone
}) {
  const statusColor =
    statusTone === "error"
      ? "#991B1B"
      : statusTone === "warning"
        ? "#92400E"
        : statusTone === "success"
          ? "#111111"
          : "rgba(17, 17, 17, 0.72)"

  return (
    <MediaSurface gap={compact ? 10 : 12} padding={compact ? 14 : 16}>
      <View style={{ gap: 4 }}>
        <Text style={{ fontSize: compact ? 12 : 13, fontWeight: "700", color: "#111111" }}>
          {mode === "edit" ? "Edit entry" : "Create entry"}
        </Text>
        <Text style={{ fontSize: compact ? 12 : 13, lineHeight: 18, color: statusColor }}>
          {statusMessage}
        </Text>
      </View>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <MediaActionButton
          disabled={saving}
          label="Cancel"
          onPress={onCancel}
          size={compact ? "compact" : "default"}
          style={{ flex: 1 }}
          variant="muted"
        />
        <MediaActionButton
          disabled={disabled}
          label={saving ? "Saving…" : mode === "edit" ? "Save changes" : "Create entry"}
          onPress={onSave}
          size={compact ? "compact" : "default"}
          style={{ flex: 1 }}
          variant="solid"
        />
      </View>
    </MediaSurface>
  )
}
