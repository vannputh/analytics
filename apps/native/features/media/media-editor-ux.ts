import type { MediaDraft } from "@analytics/domain"

import type { MetadataSearchSource } from "@/features/media/media-types"

export type MediaEditorFeedbackTone = "neutral" | "success" | "warning" | "error"
export type MediaEditorFooterLayout = "regular" | "compact"

export interface MediaEditorStatusFeedback {
  message: string
  tone: MediaEditorFeedbackTone
}

export function getMetadataSourceFeedbackLabel(source: MetadataSearchSource) {
  return source === "tmdb" ? "Filled from TMDB" : "Filled from OMDb"
}

export function createSelectedMetadataFeedback(source: MetadataSearchSource): MediaEditorStatusFeedback {
  return {
    message: `${getMetadataSourceFeedbackLabel(source)}. Core details are ready to review.`,
    tone: "success",
  }
}

export function deriveMediaEditorFooterLayout(keyboardVisible: boolean): MediaEditorFooterLayout {
  return keyboardVisible ? "compact" : "regular"
}

export function deriveMediaEditorSaveFeedback({
  draft,
  saving,
  selectedSource,
}: {
  draft: Partial<MediaDraft>
  saving: boolean
  selectedSource: MetadataSearchSource | null
}): MediaEditorStatusFeedback {
  if (saving) {
    return {
      message: "Saving your entry…",
      tone: "neutral",
    }
  }

  if (!draft.title?.trim()) {
    return {
      message: "Title required",
      tone: "warning",
    }
  }

  if (selectedSource) {
    return {
      message: `${getMetadataSourceFeedbackLabel(selectedSource)}. Ready to save.`,
      tone: "success",
    }
  }

  return {
    message: "Ready to save",
    tone: "neutral",
  }
}
