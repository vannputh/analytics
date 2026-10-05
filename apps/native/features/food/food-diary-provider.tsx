import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

import type { FoodEntryDetail, FoodFieldOptions } from "@analytics/data"
import { createFoodRepository, createStorageRepository } from "@analytics/data"
import type {
  FoodCalendarDay,
  FoodEntry,
  FoodEntryImage,
  FoodEntryImageInsert,
  FoodEntryInsert,
  FoodEntryUpdate,
} from "@analytics/domain"
import {
  buildFoodCalendarMonth,
  createFoodDuplicateEntryDraft,
  formatFoodDateKey,
  toggleFoodSelectedDate,
} from "@analytics/domain"

import { useAuth } from "@/components/auth-provider"
import { getNativeConfigurationError } from "@/lib/config"
import { supabase } from "@/lib/supabase"

interface UploadPlaceImageInput {
  contentType: string
  data: ArrayBuffer
  entryId: string
  fileName?: string | null
}

interface FoodDiaryContextValue {
  calendarDays: FoodCalendarDay[]
  createEntry(input: FoodEntryInsert): Promise<FoodEntry>
  createDuplicateDraft(entryId: string, visitDate: string): Promise<Partial<FoodEntryInsert> | null>
  currentMonth: number
  currentYear: number
  deleteEntry(id: string): Promise<void>
  entriesByDate: Record<string, FoodEntry[]>
  error: string | null
  fieldOptions: FoodFieldOptions
  getEntryById(id: string): FoodEntry | FoodEntryDetail | null
  goToNextMonth(): void
  goToPreviousMonth(): void
  goToToday(): void
  insertPlaceImage(input: FoodEntryImageInsert): Promise<FoodEntryImage>
  loadEntryDetail(id: string): Promise<FoodEntryDetail | null>
  loading: boolean
  lookupLocalPlaces(query: string): Promise<FoodEntry[]>
  refreshMonth(options?: { silent?: boolean }): Promise<void>
  refreshing: boolean
  selectedDate: string | null
  selectedEntries: FoodEntry[]
  setSelectedDate(nextDate: string | null): void
  toggleSelectedDate(nextDate: string): void
  updateEntry(id: string, input: FoodEntryUpdate): Promise<FoodEntry>
  uploadPlaceImage(input: UploadPlaceImageInput): Promise<{ path: string; publicUrl: string }>
}

const FoodDiaryContext = createContext<FoodDiaryContextValue | null>(null)

function getTodayParts() {
  const today = new Date()
  return {
    month: today.getMonth(),
    year: today.getFullYear(),
    dateKey: formatFoodDateKey(today),
  }
}

export function FoodDiaryProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const today = useMemo(() => getTodayParts(), [])
  const [currentYear, setCurrentYear] = useState(today.year)
  const [currentMonth, setCurrentMonth] = useState(today.month)
  const [selectedDate, setSelectedDate] = useState<string | null>(today.dateKey)
  const [entriesByDate, setEntriesByDate] = useState<Record<string, FoodEntry[]>>({})
  const [detailById, setDetailById] = useState<Record<string, FoodEntryDetail>>({})
  const [fieldOptions, setFieldOptions] = useState<FoodFieldOptions>({
    categories: [],
    cities: [],
    cuisineTypes: [],
    itemCategories: [],
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const configurationError = getNativeConfigurationError()
  const repository = useMemo(() => (supabase ? createFoodRepository(supabase) : null), [])
  const storageRepository = useMemo(() => (supabase ? createStorageRepository(supabase) : null), [])

  const allEntries = useMemo(() => Object.values(entriesByDate).flat(), [entriesByDate])
  const selectedEntries = useMemo(
    () => (selectedDate ? entriesByDate[selectedDate] ?? [] : []),
    [entriesByDate, selectedDate],
  )
  const calendarDays = useMemo(
    () => buildFoodCalendarMonth(currentYear, currentMonth),
    [currentMonth, currentYear],
  )

  const refreshMonth = useCallback(async (options?: { silent?: boolean }) => {
    if (!repository) {
      setError(configurationError ?? "Native configuration is incomplete.")
      setLoading(false)
      setRefreshing(false)
      return
    }

    if (options?.silent) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      setError(null)
      const grouped = await repository.getEntriesForMonth(currentYear, currentMonth + 1, {
        includeImages: true,
      })
      setEntriesByDate(grouped)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load food entries.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [configurationError, currentMonth, currentYear, repository])

  useEffect(() => {
    void refreshMonth()
  }, [refreshMonth])

  useEffect(() => {
    if (!repository) {
      return
    }

    const foodRepository = repository
    let active = true

    async function loadOptions() {
      try {
        const options = await foodRepository.getFieldOptions()
        if (active) {
          setFieldOptions(options)
        }
      } catch {
        if (active) {
          setFieldOptions({
            categories: [],
            cities: [],
            cuisineTypes: [],
            itemCategories: [],
          })
        }
      }
    }

    void loadOptions()

    return () => {
      active = false
    }
  }, [repository])

  const getEntryById = useCallback(
    (id: string) => detailById[id] ?? allEntries.find((entry) => entry.id === id) ?? null,
    [allEntries, detailById],
  )

  const loadEntryDetail = useCallback(
    async (id: string) => {
      if (!repository) {
        throw new Error(configurationError ?? "Native configuration is incomplete.")
      }

      const existing = detailById[id]
      if (existing) {
        return existing
      }

      const entry = await repository.getEntryById(id, { includeImages: true })
      if (entry) {
        setDetailById((previous) => ({ ...previous, [id]: entry }))
      }
      return entry
    },
    [configurationError, detailById, repository],
  )

  const createEntry = useCallback(
    async (input: FoodEntryInsert) => {
      if (!repository) {
        throw new Error(configurationError ?? "Native configuration is incomplete.")
      }

      const entry = await repository.createEntry(input)
      await refreshMonth({ silent: true })
      return entry
    },
    [configurationError, refreshMonth, repository],
  )

  const createDuplicateDraft = useCallback(
    async (entryId: string, visitDate: string) => {
      const entry = await loadEntryDetail(entryId)
      if (!entry) {
        return null
      }

      return createFoodDuplicateEntryDraft(entry, visitDate)
    },
    [loadEntryDetail],
  )

  const updateEntry = useCallback(
    async (id: string, input: FoodEntryUpdate) => {
      if (!repository) {
        throw new Error(configurationError ?? "Native configuration is incomplete.")
      }

      const entry = await repository.updateEntry(id, input)
      setDetailById((previous) =>
        previous[id]
          ? {
              ...previous,
              [id]: {
                ...previous[id],
                ...entry,
              },
            }
          : previous,
      )
      await refreshMonth({ silent: true })
      return entry
    },
    [configurationError, refreshMonth, repository],
  )

  const deleteEntry = useCallback(
    async (id: string) => {
      if (!repository) {
        throw new Error(configurationError ?? "Native configuration is incomplete.")
      }

      await repository.deleteEntry(id)
      setDetailById((previous) => {
        const next = { ...previous }
        delete next[id]
        return next
      })
      await refreshMonth({ silent: true })
    },
    [configurationError, refreshMonth, repository],
  )

  const lookupLocalPlaces = useCallback(
    async (query: string) => {
      if (!repository || query.trim().length < 2) {
        return []
      }

      return repository.getLocalPlaceSuggestions(query.trim(), 8)
    },
    [repository],
  )

  const uploadPlaceImage = useCallback(
    async ({ contentType, data, entryId, fileName }: UploadPlaceImageInput) => {
      if (!storageRepository) {
        throw new Error(configurationError ?? "Native configuration is incomplete.")
      }

      return storageRepository.uploadFoodPlaceImage({
        entryId,
        fileName,
        contentType,
        file: data,
      })
    },
    [configurationError, storageRepository],
  )

  const insertPlaceImage = useCallback(
    async (input: FoodEntryImageInsert) => {
      if (!repository) {
        throw new Error(configurationError ?? "Native configuration is incomplete.")
      }

      if (!userId) {
        throw new Error("You must be signed in to add food photos.")
      }

      return repository.insertEntryImage({
        ...input,
        user_id: input.user_id ?? userId,
      })
    },
    [configurationError, repository, userId],
  )

  const goToPreviousMonth = useCallback(() => {
    setSelectedDate(null)
    setCurrentMonth((previous) => {
      if (previous === 0) {
        setCurrentYear((year) => year - 1)
        return 11
      }
      return previous - 1
    })
  }, [])

  const goToNextMonth = useCallback(() => {
    setSelectedDate(null)
    setCurrentMonth((previous) => {
      if (previous === 11) {
        setCurrentYear((year) => year + 1)
        return 0
      }
      return previous + 1
    })
  }, [])

  const goToToday = useCallback(() => {
    const now = getTodayParts()
    setCurrentYear(now.year)
    setCurrentMonth(now.month)
    setSelectedDate(now.dateKey)
  }, [])

  const toggleSelectedDate = useCallback((nextDate: string) => {
    setSelectedDate((previous) => toggleFoodSelectedDate(previous, nextDate))
  }, [])

  const value = useMemo<FoodDiaryContextValue>(
    () => ({
      calendarDays,
      createEntry,
      createDuplicateDraft,
      currentMonth,
      currentYear,
      deleteEntry,
      entriesByDate,
      error,
      fieldOptions,
      getEntryById,
      goToNextMonth,
      goToPreviousMonth,
      goToToday,
      insertPlaceImage,
      loadEntryDetail,
      loading,
      lookupLocalPlaces,
      refreshMonth,
      refreshing,
      selectedDate,
      selectedEntries,
      setSelectedDate,
      toggleSelectedDate,
      updateEntry,
      uploadPlaceImage,
    }),
    [
      calendarDays,
      createEntry,
      createDuplicateDraft,
      currentMonth,
      currentYear,
      deleteEntry,
      entriesByDate,
      error,
      fieldOptions,
      getEntryById,
      goToNextMonth,
      goToPreviousMonth,
      goToToday,
      insertPlaceImage,
      loadEntryDetail,
      loading,
      lookupLocalPlaces,
      refreshMonth,
      refreshing,
      selectedDate,
      selectedEntries,
      updateEntry,
      uploadPlaceImage,
    ],
  )

  return <FoodDiaryContext.Provider value={value}>{children}</FoodDiaryContext.Provider>
}

export function useFoodDiary() {
  const context = useContext(FoodDiaryContext)

  if (!context) {
    throw new Error("useFoodDiary must be used within a FoodDiaryProvider.")
  }

  return context
}
