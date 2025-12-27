import { MediaEntry } from "./database.types"

export interface FilterState {
  dateFrom: string | null
  dateTo: string | null
  genres: string[]
  mediums: string[]
  languages: string[]
  platforms: string[]
  statuses: string[]
  types: string[]
}

export const defaultFilterState: FilterState = {
  dateFrom: null,
  dateTo: null,
  genres: [],
  mediums: [],
  languages: [],
  platforms: [],
  statuses: [],
  types: [],
}

/**
 * Apply filters to a list of media entries
 * Returns filtered data for immediate metric calculation
 */
export function applyFilters(data: MediaEntry[], filters: FilterState): MediaEntry[] {
  return data.filter((entry) => {
    // Date range filter (finish_date based)
    if (filters.dateFrom) {
      const finishDate = entry.finish_date || entry.start_date
      if (!finishDate || finishDate < filters.dateFrom) return false
    }
    if (filters.dateTo) {
      const finishDate = entry.finish_date || entry.start_date
      if (!finishDate || finishDate > filters.dateTo) return false
    }

    // Medium filter
    if (filters.mediums.length > 0) {
      if (!entry.medium || !filters.mediums.includes(entry.medium)) return false
    }

    // Language filter
    if (filters.languages.length > 0) {
      if (!entry.language || !filters.languages.includes(entry.language)) return false
    }

    // Platform filter
    if (filters.platforms.length > 0) {
      if (!entry.platform || !filters.platforms.includes(entry.platform)) return false
    }

    // Status filter
    if (filters.statuses.length > 0) {
      if (!entry.status || !filters.statuses.includes(entry.status)) return false
    }

    // Type filter
    if (filters.types.length > 0) {
      if (!entry.type || !filters.types.includes(entry.type)) return false
    }

    // Genre filter (AND logic - entry must have ALL selected genres)
    if (filters.genres.length > 0) {
      if (!entry.genre || !Array.isArray(entry.genre)) return false
      const entryGenres = entry.genre.map((g) => g.toLowerCase().trim())
      for (const filterGenre of filters.genres) {
        if (!entryGenres.includes(filterGenre.toLowerCase().trim())) return false
      }
    }

    return true
  })
}

/**
 * Extract unique values from data for filter options
 */
export function extractFilterOptions(data: MediaEntry[]) {
  const genres = new Set<string>()
  const mediums = new Set<string>()
  const languages = new Set<string>()
  const platforms = new Set<string>()
  const statuses = new Set<string>()
  const types = new Set<string>()

  for (const entry of data) {
    if (entry.medium) mediums.add(entry.medium)
    if (entry.language) languages.add(entry.language)
    if (entry.platform) platforms.add(entry.platform)
    if (entry.status) statuses.add(entry.status)
    if (entry.type) types.add(entry.type)
    if (entry.genre && Array.isArray(entry.genre)) {
      entry.genre.forEach((g) => {
        if (g.trim()) genres.add(g.trim())
      })
    }
  }

  return {
    genres: Array.from(genres).sort(),
    mediums: Array.from(mediums).sort(),
    languages: Array.from(languages).sort(),
    platforms: Array.from(platforms).sort(),
    statuses: Array.from(statuses).sort(),
    types: Array.from(types).sort(),
  }
}


/**
 * Deep comparison of two FilterState objects
 */
export function areFiltersEqual(a: FilterState, b: FilterState): boolean {
  if (a.dateFrom !== b.dateFrom) return false
  if (a.dateTo !== b.dateTo) return false

  // Helper to compare arrays (order doesn't matter)
  const areArraysEqual = (arr1: string[], arr2: string[]) => {
    if (arr1.length !== arr2.length) return false
    const s1 = [...arr1].sort()
    const s2 = [...arr2].sort()
    return s1.every((val, index) => val === s2[index])
  }

  if (!areArraysEqual(a.genres, b.genres)) return false
  if (!areArraysEqual(a.mediums, b.mediums)) return false
  if (!areArraysEqual(a.languages, b.languages)) return false
  if (!areArraysEqual(a.platforms, b.platforms)) return false
  if (!areArraysEqual(a.statuses, b.statuses)) return false
  if (!areArraysEqual(a.types, b.types)) return false

  return true
}
