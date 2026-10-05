import { useMemo, useState } from "react"

import type { MediaEntry } from "@analytics/domain"
import { defaultFilterState, type FilterState } from "@analytics/domain"

import { deriveMediaDiaryState, type DerivedMediaDiaryState } from "@/features/media/media-diary-state"

export interface MediaDiaryStateResult extends DerivedMediaDiaryState {
  filters: FilterState
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>
}

export function useMediaDiaryState(allEntries: MediaEntry[]): MediaDiaryStateResult {
  const [filters, setFilters] = useState<FilterState>(defaultFilterState)

  const derivedState = useMemo(
    () => deriveMediaDiaryState(allEntries, filters),
    [allEntries, filters],
  )

  return {
    filters,
    setFilters,
    ...derivedState,
  }
}
