import {
  applyMediaDraftRules,
  getMetadataOverrideFields,
  mergeMetadataIntoDraft,
  type MediaDraft,
  type MediaMetadata,
} from "@analytics/domain"

function resolveMediumFromMetadata(metadata: MediaMetadata): MediaDraft["medium"] | undefined {
  if (metadata.type === "Movie") {
    return "Movie"
  }

  if (metadata.type === "TV Show") {
    return "TV Show"
  }

  return undefined
}

export function applySelectedMetadataToDraft(
  currentDraft: Partial<MediaDraft>,
  metadata: MediaMetadata,
) {
  const overrideFields = getMetadataOverrideFields(currentDraft, metadata)
  const mergedDraft = mergeMetadataIntoDraft(currentDraft, metadata, overrideFields)
  const nextMedium = resolveMediumFromMetadata(metadata)

  return applyMediaDraftRules({
    ...mergedDraft,
    medium: nextMedium ?? mergedDraft.medium,
  })
}
