"use client"

import { useMemo, useState } from "react"

import type { MediaEntry } from "@analytics/domain"
import {
  applyFilters,
  defaultFilterState,
  extractFilterOptions,
  type FilterState,
} from "@analytics/domain"

export interface MediaFilterStateResult {
  filters: FilterState
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>
  searchQuery: string
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>
  filterOptions: ReturnType<typeof extractFilterOptions>
  filteredEntries: MediaEntry[]
}

export function useMediaFilterState(allEntries: MediaEntry[]): MediaFilterStateResult {
  const [filters, setFilters] = useState<FilterState>(defaultFilterState)
  const [searchQuery, setSearchQuery] = useState("")

  const filterOptions = useMemo(() => extractFilterOptions(allEntries), [allEntries])
  const filterFilteredEntries = useMemo(() => applyFilters(allEntries, filters), [allEntries, filters])

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) {
      return filterFilteredEntries
    }

    const query = searchQuery.toLowerCase().trim()
    return filterFilteredEntries.filter((entry) => {
      if (entry.title?.toLowerCase().includes(query)) return true
      if (entry.genre && Array.isArray(entry.genre) && entry.genre.some((genre) => genre.toLowerCase().includes(query))) return true
      if (entry.platform?.toLowerCase().includes(query)) return true
      if (entry.type?.toLowerCase().includes(query)) return true
      if (entry.medium?.toLowerCase().includes(query)) return true
      if (entry.language && Array.isArray(entry.language) && entry.language.some((language) => language.toLowerCase().includes(query))) return true
      if (entry.status?.toLowerCase().includes(query)) return true
      if (entry.season?.toLowerCase().includes(query)) return true
      return false
    })
  }, [filterFilteredEntries, searchQuery])

  return {
    filters,
    setFilters,
    searchQuery,
    setSearchQuery,
    filterOptions,
    filteredEntries,
  }
}
