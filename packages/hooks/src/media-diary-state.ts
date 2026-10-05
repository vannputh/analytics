import type { MediaDiaryEntries, MediaEntry } from "@analytics/domain"
import {
  applyFilters,
  extractFilterOptions,
  partitionMediaDiaryEntries,
  type FilterState,
} from "@analytics/domain"

export interface DerivedMediaDiaryState {
  diaryEntries: MediaDiaryEntries
  filterOptions: ReturnType<typeof extractFilterOptions>
  watchedEntries: MediaEntry[]
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
