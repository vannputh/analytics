import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"

import type {
  FilterState,
  MediaDraft,
  MediaEntry,
  MediaFieldOptions,
  MediaMetadata,
  MediaStatusHistory,
} from "@analytics/domain"
import {
  buildInitialEpisodeHistory,
  buildMediaEntryPayload,
  addEpisodeHistoryRecord,
  defaultFilterState,
  deleteEpisodeHistoryRecord,
  extractFilterOptions,
  parseEpisodeHistory,
  updateEpisodeHistoryRecord,
} from "@analytics/domain"
import {
  createMediaRepository,
  createStorageRepository,
  createUserPreferenceRepository,
} from "@analytics/data"

import { useAuth } from "@/components/auth-provider"
import { buildApiUrl } from "@/lib/api"
import { getNativeConfigurationError } from "@/lib/config"
import {
  createMediaDiaryAreaPersistScheduler,
  resolvePersistedMediaDiaryArea,
  shouldPersistMediaDiaryArea,
} from "@/features/media/media-diary-active-area-persistence"
import {
  DEFAULT_MEDIA_DIARY_AREA,
  deriveMediaDiaryState,
  normalizeMediaDiaryArea,
  type DerivedMediaDiaryState,
} from "@/features/media/media-diary-state"
import {
  fetchMetadataFromApi,
  searchMetadataFromApi,
} from "@/features/media/media-metadata-client"
import { supabase } from "@/lib/supabase"
import {
  DEFAULT_MEDIA_DISPLAY_PREFERENCES,
  type MediaDiaryArea,
  type MediaDisplayPreferences,
  type MetadataSearchResult,
} from "@/features/media/media-types"

interface UploadPosterInput {
  contentType: string
  data: ArrayBuffer
  fileName?: string | null
  title?: string | null
}

interface UpdateWatchingDateInput {
  date: string
  episodeHistoryIndex?: number
}

interface MediaDiaryContextValue extends DerivedMediaDiaryState {
  activeArea: MediaDiaryArea
  allEntries: MediaEntry[]
  createEntry(draft: Partial<MediaDraft>): Promise<MediaEntry>
  deleteEpisodeHistoryAt(id: string, index: number): Promise<MediaEntry>
  deleteEntry(id: string): Promise<void>
  displayPreferences: MediaDisplayPreferences
  entryFieldOptions: MediaFieldOptions
  error: string | null
  fetchMetadata(params: Record<string, string | undefined>): Promise<MediaMetadata>
  filters: FilterState
  getEntryById(id: string): MediaEntry | null
  getStatusHistory(mediaEntryId: string): Promise<MediaStatusHistory[]>
  loading: boolean
  refreshEntries(): Promise<void>
  refreshing: boolean
  restartEntry(id: string): Promise<MediaEntry>
  searchMetadata(query: string): Promise<MetadataSearchResult[]>
  setActiveArea(nextArea: MediaDiaryArea): void
  setActiveWatchThisEntryId(entryId: string | null): void
  setDisplayPreference(key: keyof MediaDisplayPreferences, value: boolean): Promise<void>
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>
  updateEntry(id: string, draft: Partial<MediaDraft>): Promise<MediaEntry>
  updateWatchingDate(id: string, input: UpdateWatchingDateInput): Promise<MediaEntry>
  updateWatchingProgress(id: string, direction: "increment" | "decrement"): Promise<MediaEntry>
  uploadPoster(input: UploadPosterInput): Promise<string>
  userId: string | null
  watchThisEntry: MediaEntry | null
}

const DISPLAY_PREFERENCES_KEY = "native-media-display-preferences"
const ACTIVE_AREA_KEY = "native-media-active-area"
const MediaDiaryContext = createContext<MediaDiaryContextValue | null>(null)

function replaceEntry(entries: MediaEntry[], nextEntry: MediaEntry) {
  const existingIndex = entries.findIndex((entry) => entry.id === nextEntry.id)

  if (existingIndex === -1) {
    return [nextEntry, ...entries]
  }

  return entries.map((entry) => (entry.id === nextEntry.id ? nextEntry : entry))
}

export function MediaDiaryProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const [allEntries, setAllEntries] = useState<MediaEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterState>(defaultFilterState)
  const [displayPreferences, setDisplayPreferences] = useState<MediaDisplayPreferences>(
    DEFAULT_MEDIA_DISPLAY_PREFERENCES,
  )
  const [activeArea, setActiveAreaState] = useState<MediaDiaryArea>(DEFAULT_MEDIA_DIARY_AREA)
  const [displayPreferencesLoaded, setDisplayPreferencesLoaded] = useState(false)
  const [activeAreaLoaded, setActiveAreaLoaded] = useState(false)
  const [activeWatchThisEntryId, setActiveWatchThisEntryId] = useState<string | null>(null)
  const persistedActiveAreaRef = useRef<MediaDiaryArea>(DEFAULT_MEDIA_DIARY_AREA)
  const persistActiveAreaRef = useRef<(nextArea: MediaDiaryArea) => Promise<void>>(async () => {})
  const activeAreaPersistSchedulerRef = useRef<ReturnType<typeof createMediaDiaryAreaPersistScheduler> | null>(null)

  const configurationError = getNativeConfigurationError()
  const mediaRepository = useMemo(() => (supabase ? createMediaRepository(supabase) : null), [])
  const storageRepository = useMemo(() => (supabase ? createStorageRepository(supabase) : null), [])
  const preferenceRepository = useMemo(
    () => (supabase ? createUserPreferenceRepository(supabase) : null),
    [],
  )

  const derivedState = useMemo(
    () => deriveMediaDiaryState(allEntries, filters),
    [allEntries, filters],
  )

  const watchThisEntry = useMemo(
    () => allEntries.find((entry) => entry.id === activeWatchThisEntryId) ?? null,
    [activeWatchThisEntryId, allEntries],
  )

  const entryFieldOptions = useMemo<MediaFieldOptions>(
    () => ({
      ...extractFilterOptions(allEntries),
    }),
    [allEntries],
  )

  const loadEntries = useCallback(
    async (mode: "initial" | "refresh") => {
      if (mode === "refresh") {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      if (!mediaRepository) {
        setError(configurationError ?? "Native configuration is incomplete.")
        setLoading(false)
        setRefreshing(false)
        return
      }

      try {
        setError(null)
        const entries = await mediaRepository.getEntries()
        setAllEntries(entries)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load media entries.")
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [configurationError, mediaRepository],
  )

  const persistActiveArea = useCallback(
    async (nextArea: MediaDiaryArea) => {
      if (!preferenceRepository || !userId) {
        return
      }

      await preferenceRepository.setUserPreference(userId, ACTIVE_AREA_KEY, nextArea)
    },
    [preferenceRepository, userId],
  )

  persistActiveAreaRef.current = persistActiveArea

  if (!activeAreaPersistSchedulerRef.current) {
    activeAreaPersistSchedulerRef.current = createMediaDiaryAreaPersistScheduler({
      persist: async (nextArea) => {
        await persistActiveAreaRef.current(nextArea)
        persistedActiveAreaRef.current = nextArea
      },
    })
  }

  const activeAreaPersistScheduler = activeAreaPersistSchedulerRef.current

  useEffect(() => {
    void loadEntries("initial")
  }, [loadEntries])

  useEffect(() => {
    if (!preferenceRepository || !userId) {
      setDisplayPreferences(DEFAULT_MEDIA_DISPLAY_PREFERENCES)
      setActiveAreaState(DEFAULT_MEDIA_DIARY_AREA)
      persistedActiveAreaRef.current = DEFAULT_MEDIA_DIARY_AREA
      setDisplayPreferencesLoaded(true)
      setActiveAreaLoaded(true)
      return
    }

    let active = true

    async function loadPreferences() {
      const repository = preferenceRepository
      const nextUserId = userId

      if (!repository || !nextUserId) {
        return
      }

      try {
        const [savedPreferences, savedArea] = await Promise.all([
          repository.getUserPreference<Partial<MediaDisplayPreferences>>(nextUserId, DISPLAY_PREFERENCES_KEY),
          repository.getUserPreference<string>(nextUserId, ACTIVE_AREA_KEY),
        ])

        if (!active) {
          return
        }

        if (savedPreferences) {
          setDisplayPreferences({
            ...DEFAULT_MEDIA_DISPLAY_PREFERENCES,
            ...savedPreferences,
          })
        } else {
          setDisplayPreferences(DEFAULT_MEDIA_DISPLAY_PREFERENCES)
        }

        const restoredArea = resolvePersistedMediaDiaryArea(savedArea)
        setActiveAreaState(restoredArea)
        persistedActiveAreaRef.current = restoredArea
      } catch {
        if (active) {
          setDisplayPreferences(DEFAULT_MEDIA_DISPLAY_PREFERENCES)
          setActiveAreaState(DEFAULT_MEDIA_DIARY_AREA)
          persistedActiveAreaRef.current = DEFAULT_MEDIA_DIARY_AREA
        }
      } finally {
        if (active) {
          setDisplayPreferencesLoaded(true)
          setActiveAreaLoaded(true)
        }
      }
    }

    void loadPreferences()

    return () => {
      active = false
    }
  }, [preferenceRepository, userId])

  useEffect(() => {
    if (
      !shouldPersistMediaDiaryArea({
        activeArea,
        activeAreaLoaded,
        persistedArea: persistedActiveAreaRef.current,
      })
    ) {
      return
    }

    activeAreaPersistScheduler.queue(activeArea)
  }, [activeArea, activeAreaLoaded, activeAreaPersistScheduler])

  useEffect(() => {
    return () => {
      activeAreaPersistScheduler.cancel()
    }
  }, [activeAreaPersistScheduler])

  const persistDisplayPreferences = useCallback(
    async (nextPreferences: MediaDisplayPreferences) => {
      if (!preferenceRepository || !userId) {
        return
      }

      await preferenceRepository.setUserPreference(userId, DISPLAY_PREFERENCES_KEY, nextPreferences)
    },
    [preferenceRepository, userId],
  )

  const upsertEntry = useCallback((entry: MediaEntry) => {
    setAllEntries((current) => replaceEntry(current, entry))
  }, [])

  const removeEntry = useCallback((id: string) => {
    setAllEntries((current) => current.filter((entry) => entry.id !== id))
  }, [])

  const ensureUserId = useCallback(() => {
    if (!userId) {
      throw new Error("You must be signed in to modify media entries.")
    }

    return userId
  }, [userId])

  const getEntryById = useCallback(
    (id: string) => allEntries.find((entry) => entry.id === id) ?? null,
    [allEntries],
  )

  const createEntry = useCallback(
    async (draft: Partial<MediaDraft>) => {
      if (!mediaRepository) {
        throw new Error(configurationError ?? "Native configuration is incomplete.")
      }

      const nextUserId = ensureUserId()
      const payload = buildMediaEntryPayload(draft)

      if (!payload.title.trim()) {
        throw new Error("Title is required")
      }

      const createdEntry = await mediaRepository.createEntry({
        ...payload,
        user_id: nextUserId,
      })

      const initialEpisodeHistory = buildInitialEpisodeHistory(payload)
      if (initialEpisodeHistory) {
        const updatedEntry = await mediaRepository.updateEntry(createdEntry.id, initialEpisodeHistory)
        upsertEntry(updatedEntry)
        return updatedEntry
      }

      upsertEntry(createdEntry)
      return createdEntry
    },
    [configurationError, ensureUserId, mediaRepository, upsertEntry],
  )

  const updateEntry = useCallback(
    async (id: string, draft: Partial<MediaDraft>) => {
      if (!mediaRepository) {
        throw new Error(configurationError ?? "Native configuration is incomplete.")
      }

      const payload = buildMediaEntryPayload(draft)

      if (!payload.title.trim()) {
        throw new Error("Title is required")
      }

      const updatedEntry = await mediaRepository.updateEntry(id, payload)
      upsertEntry(updatedEntry)
      return updatedEntry
    },
    [configurationError, mediaRepository, upsertEntry],
  )

  const deleteEntry = useCallback(
    async (id: string) => {
      if (!mediaRepository) {
        throw new Error(configurationError ?? "Native configuration is incomplete.")
      }

      await mediaRepository.deleteEntry(id)
      removeEntry(id)
    },
    [configurationError, mediaRepository, removeEntry],
  )

  const deleteEpisodeHistoryAt = useCallback(
    async (id: string, index: number) => {
      if (!mediaRepository) {
        throw new Error(configurationError ?? "Native configuration is incomplete.")
      }

      const entry = getEntryById(id)

      if (!entry) {
        throw new Error("Entry not found")
      }

      const updates = deleteEpisodeHistoryRecord(parseEpisodeHistory(entry.episode_history), index)
      const updatedEntry = await mediaRepository.updateEntry(id, updates)
      upsertEntry(updatedEntry)
      return updatedEntry
    },
    [configurationError, getEntryById, mediaRepository, upsertEntry],
  )

  const restartEntry = useCallback(
    async (id: string) => {
      if (!mediaRepository) {
        throw new Error(configurationError ?? "Native configuration is incomplete.")
      }

      const updatedEntry = await mediaRepository.restartEntry(id)
      upsertEntry(updatedEntry)
      return updatedEntry
    },
    [configurationError, mediaRepository, upsertEntry],
  )

  const getStatusHistory = useCallback(
    async (mediaEntryId: string) => {
      if (!mediaRepository) {
        throw new Error(configurationError ?? "Native configuration is incomplete.")
      }

      return mediaRepository.getStatusHistory(mediaEntryId)
    },
    [configurationError, mediaRepository],
  )

  const searchMetadata = useCallback(async (query: string) => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      return []
    }

    return await searchMetadataFromApi(
      buildApiUrl(`/api/metadata/search?q=${encodeURIComponent(trimmed)}`),
    )
  }, [])

  const fetchMetadata = useCallback(async (params: Record<string, string | undefined>) => {
    const searchParams = new URLSearchParams()

    for (const [key, value] of Object.entries(params)) {
      if (value?.trim()) {
        searchParams.set(key, value.trim())
      }
    }

    return await fetchMetadataFromApi(buildApiUrl(`/api/metadata?${searchParams.toString()}`))
  }, [])

  const updateWatchingProgress = useCallback(
    async (id: string, direction: "increment" | "decrement") => {
      if (!mediaRepository) {
        throw new Error(configurationError ?? "Native configuration is incomplete.")
      }

      const entry = getEntryById(id)

      if (!entry) {
        throw new Error("Entry not found")
      }

      const history = parseEpisodeHistory(entry.episode_history)
      let updates: Partial<MediaEntry>

      if (direction === "increment") {
        const nextEpisode = (entry.episodes_watched ?? 0) + 1
        updates = addEpisodeHistoryRecord(history, nextEpisode, new Date().toISOString())
      } else {
        const nextIndex = history.findIndex((item) => item.episode === (entry.episodes_watched ?? 0))
        updates = deleteEpisodeHistoryRecord(history, nextIndex === -1 ? 0 : nextIndex)
      }

      const updatedEntry = await mediaRepository.updateEntry(id, {
        ...updates,
      })
      upsertEntry(updatedEntry)
      return updatedEntry
    },
    [configurationError, getEntryById, mediaRepository, upsertEntry],
  )

  const updateWatchingDate = useCallback(
    async (id: string, input: UpdateWatchingDateInput) => {
      if (!mediaRepository) {
        throw new Error(configurationError ?? "Native configuration is incomplete.")
      }

      const entry = getEntryById(id)

      if (!entry) {
        throw new Error("Entry not found")
      }

      const nextDate = input.date.trim()
      if (!nextDate) {
        throw new Error("Date is required")
      }

      const history = parseEpisodeHistory(entry.episode_history)
      const updates =
        typeof input.episodeHistoryIndex === "number"
          ? updateEpisodeHistoryRecord(history, input.episodeHistoryIndex, nextDate)
          : { last_watched_at: nextDate }

      const updatedEntry = await mediaRepository.updateEntry(id, updates)
      upsertEntry(updatedEntry)
      return updatedEntry
    },
    [configurationError, getEntryById, mediaRepository, upsertEntry],
  )

  const uploadPoster = useCallback(
    async ({ contentType, data, fileName, title }: UploadPosterInput) => {
      if (!storageRepository) {
        throw new Error(configurationError ?? "Native configuration is incomplete.")
      }

      const nextUserId = ensureUserId()
      const upload = await storageRepository.uploadMediaPoster({
        userId: nextUserId,
        title,
        fileName,
        contentType,
        file: data,
      })

      return upload.publicUrl
    },
    [configurationError, ensureUserId, storageRepository],
  )

  const setDisplayPreference = useCallback(
    async (key: keyof MediaDisplayPreferences, value: boolean) => {
      const nextPreferences = {
        ...displayPreferences,
        [key]: value,
      }

      setDisplayPreferences(nextPreferences)

      if (displayPreferencesLoaded) {
        await persistDisplayPreferences(nextPreferences)
      }
    },
    [displayPreferences, displayPreferencesLoaded, persistDisplayPreferences],
  )

  const setActiveArea = useCallback(
    (nextArea: MediaDiaryArea) => {
      const normalizedArea = normalizeMediaDiaryArea(nextArea)
      setActiveAreaState(normalizedArea)
    },
    [],
  )

  const value = useMemo<MediaDiaryContextValue>(
    () => ({
      ...derivedState,
      activeArea,
      allEntries,
      createEntry,
      deleteEpisodeHistoryAt,
      deleteEntry,
      displayPreferences,
      entryFieldOptions,
      error,
      fetchMetadata,
      filters,
      getEntryById,
      getStatusHistory,
      loading,
      refreshEntries: async () => {
        await loadEntries("refresh")
      },
      refreshing,
      restartEntry,
      searchMetadata,
      setActiveArea,
      setActiveWatchThisEntryId,
      setDisplayPreference,
      setFilters,
      updateEntry,
      updateWatchingDate,
      updateWatchingProgress,
      uploadPoster,
      userId,
      watchThisEntry,
    }),
    [
      activeArea,
      allEntries,
      createEntry,
      deleteEpisodeHistoryAt,
      deleteEntry,
      derivedState,
      displayPreferences,
      entryFieldOptions,
      error,
      fetchMetadata,
      filters,
      getEntryById,
      getStatusHistory,
      loadEntries,
      loading,
      refreshing,
      restartEntry,
      searchMetadata,
      setActiveArea,
      setDisplayPreference,
      updateEntry,
      updateWatchingDate,
      updateWatchingProgress,
      uploadPoster,
      userId,
      watchThisEntry,
    ],
  )

  return <MediaDiaryContext.Provider value={value}>{children}</MediaDiaryContext.Provider>
}

export function useMediaDiary() {
  const context = useContext(MediaDiaryContext)

  if (!context) {
    throw new Error("useMediaDiary must be used inside MediaDiaryProvider.")
  }

  return context
}
