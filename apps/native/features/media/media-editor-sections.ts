export type MediaEditorSecondarySection = "metadata" | "progress" | "ratings"

export type MediaEditorSectionState = Record<MediaEditorSecondarySection, boolean>

export const MEDIA_EDITOR_SECONDARY_SECTIONS: MediaEditorSecondarySection[] = [
  "progress",
  "ratings",
  "metadata",
]

export function createInitialMediaEditorSectionState(): MediaEditorSectionState {
  return {
    metadata: false,
    progress: false,
    ratings: false,
  }
}

export function toggleMediaEditorSection(
  current: MediaEditorSectionState,
  section: MediaEditorSecondarySection,
): MediaEditorSectionState {
  return {
    ...current,
    [section]: !current[section],
  }
}
