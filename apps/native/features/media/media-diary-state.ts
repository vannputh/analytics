import type { MediaDiaryEntries, MediaEntry } from "@analytics/domain"
import {
  applyFilters,
  extractFilterOptions,
  partitionMediaDiaryEntries,
  type FilterState,
} from "@analytics/domain"

import { MEDIA_DIARY_AREAS, type MediaDiaryArea } from "@/features/media/media-types"

export interface DerivedMediaDiaryState {
  diaryEntries: MediaDiaryEntries
  filterOptions: ReturnType<typeof extractFilterOptions>
  watchedEntries: MediaEntry[]
}

export interface MediaDiaryAreaContext {
  actionLabel?: string
  count: number
  icon: string
  segmentLabel: string
  title: string
}

export interface MediaDiaryAreaPresentation {
  icon: string
  segmentLabel: string
  title: string
}

export const DEFAULT_MEDIA_DIARY_AREA: MediaDiaryArea = "watched"

const MEDIA_DIARY_AREA_PRESENTATIONS: Record<MediaDiaryArea, MediaDiaryAreaPresentation> = {
  watching: {
    icon: "play.circle.fill",
    segmentLabel: "watching",
    title: "Watching Now",
  },
  watched: {
    icon: "checkmark.circle",
    segmentLabel: "Watched",
    title: "Watched",
  },
  planned: {
    icon: "tray.full",
    segmentLabel: "Queue",
    title: "Queue",
  },
  paused: {
    icon: "pause.circle.fill",
    segmentLabel: "Paused",
    title: "Paused",
  },
  dropped: {
    icon: "xmark.circle.fill",
    segmentLabel: "dropped",
    title: "dropped",
  },
}

function getPausedEntries(entries: MediaEntry[]) {
  return entries.filter((entry) => entry.status === "On Hold")
}

function getDroppedEntries(entries: MediaEntry[]) {
  return entries.filter((entry) => entry.status === "Dropped")
}

export function deriveMediaDiaryState(
  allEntries: MediaEntry[],
  filters: FilterState,
): DerivedMediaDiaryState {
  const diaryEntries = partitionMediaDiaryEntries(allEntries)
  const filterOptions = extractFilterOptions(allEntries)
  const watchedEntries = applyFilters(diaryEntries.watched, filters)

  return {
    diaryEntries,
    filterOptions,
    watchedEntries,
  }
}

export function normalizeMediaDiaryArea(value: unknown): MediaDiaryArea {
  if (value === "backlog" || value === "planned") {
    return "planned"
  }

  if (value === "holdAndDropped") {
    return "paused"
  }

  if (typeof value === "string" && MEDIA_DIARY_AREAS.includes(value as MediaDiaryArea)) {
    return value as MediaDiaryArea
  }

  return DEFAULT_MEDIA_DIARY_AREA
}

export function getMediaDiaryAreaIndex(area: MediaDiaryArea): number {
  return MEDIA_DIARY_AREAS.indexOf(area)
}

export function getMediaDiaryAreaFromIndex(index: number): MediaDiaryArea {
  return MEDIA_DIARY_AREAS[index] ?? DEFAULT_MEDIA_DIARY_AREA
}

export function getMediaDiaryAreaContext(
  area: MediaDiaryArea,
  diaryEntries: MediaDiaryEntries,
  watchedEntries: MediaEntry[],
): MediaDiaryAreaContext {
  const presentation = getMediaDiaryAreaPresentation(area)
  const pausedEntries = getPausedEntries(diaryEntries.holdAndDropped)
  const droppedEntries = getDroppedEntries(diaryEntries.holdAndDropped)

  switch (area) {
    case "watching":
      return {
        count: diaryEntries.watching.length,
        ...presentation,
      }
    case "planned":
      return {
        actionLabel: diaryEntries.planned.length > 0 ? "Watch This" : undefined,
        count: diaryEntries.planned.length,
        ...presentation,
      }
    case "paused":
      return {
        count: pausedEntries.length,
        ...presentation,
      }
    case "dropped":
      return {
        count: droppedEntries.length,
        ...presentation,
      }
    case "watched":
    default:
      return {
        count: watchedEntries.length,
        ...presentation,
      }
  }
}

export function getMediaDiaryAreaPresentation(area: MediaDiaryArea): MediaDiaryAreaPresentation {
  return MEDIA_DIARY_AREA_PRESENTATIONS[area]
}

export function getMediaDiaryAreaSegmentLabel(area: MediaDiaryArea): string {
  return getMediaDiaryAreaPresentation(area).segmentLabel
}
