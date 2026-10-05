import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { Alert, Keyboard, Platform, TextInput, View } from "react-native"

import * as ImagePicker from "expo-image-picker"
import * as Haptics from "expo-haptics"
import { router } from "expo-router"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import {
  applyMediaDraftRules,
  createEmptyMediaDraft,
  createMediaDraftFromEntry,
  getMetadataOverrideFields,
  mergeMetadataIntoDraft,
  type MediaDraft,
  type MediaEntry,
  type MediaMetadata,
  type MediaMetadataOverrideField,
} from "@analytics/domain"

import { MediaDisclosureCard } from "@/features/media/components/media-disclosure-card"
import {
  completeMediaEditorAutocompleteSelection,
  createInitialMediaEditorAutocompleteState,
  failMediaEditorAutocompleteSearch,
  resetMediaEditorAutocompleteState,
  resolveMediaEditorAutocompleteSelection,
  shouldSearchMediaEditorAutocomplete,
  startMediaEditorAutocompleteSearch,
  succeedMediaEditorAutocompleteSearch,
} from "@/features/media/media-editor-autocomplete"
import { applySelectedMetadataToDraft } from "@/features/media/media-editor-metadata"
import {
  createSelectedMetadataFeedback,
  deriveMediaEditorFooterLayout,
  deriveMediaEditorSaveFeedback,
  getMetadataSourceFeedbackLabel,
  type MediaEditorStatusFeedback,
} from "@/features/media/media-editor-ux"
import {
  createInitialMediaEditorSectionState,
  toggleMediaEditorSection,
} from "@/features/media/media-editor-sections"
import { MediaMetadataReview } from "@/features/media/media-metadata-review"
import { useMediaDiary } from "@/features/media/media-diary-provider"
import { MediaScreenScrollView } from "@/features/media/primitives/media-screen-scroll-view"
import { MediaEditorCoreSection } from "@/features/media/sections/media-editor-core-section"
import { MediaEditorCoreDetailsSection } from "@/features/media/sections/media-editor-core-details-section"
import { MediaEditorFooterActions } from "@/features/media/sections/media-editor-footer-actions"
import { MediaEditorMetadataSection } from "@/features/media/sections/media-editor-metadata-section"
import { MediaEditorProgressSection } from "@/features/media/sections/media-editor-progress-section"
import { MediaEditorRatingsSection } from "@/features/media/sections/media-editor-ratings-section"
import type { MetadataSearchResult, MetadataSearchSource } from "@/features/media/media-types"

function toNumberOrNull(value: string) {
  if (!value.trim()) {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function MediaEditorScreen({
  entry,
  initialDraft,
  mode,
}: {
  entry?: MediaEntry | null
  initialDraft?: Partial<MediaDraft> | null
  mode: "create" | "edit"
}) {
  const {
    createEntry,
    entryFieldOptions,
    fetchMetadata,
    searchMetadata,
    updateEntry,
    uploadPoster,
  } = useMediaDiary()
  const insets = useSafeAreaInsets()

  const [draft, setDraft] = useState<MediaDraft>(() =>
    createInitialEditorDraft(entry, mode, initialDraft),
  )
  const [saving, setSaving] = useState(false)
  const [metadataLoading, setMetadataLoading] = useState(false)
  const [autocompleteState, setAutocompleteState] = useState(createInitialMediaEditorAutocompleteState)
  const [pendingMetadata, setPendingMetadata] = useState<MediaMetadata | null>(null)
  const [overrideFields, setOverrideFields] = useState<MediaMetadataOverrideField[]>([])
  const [expandedSections, setExpandedSections] = useState(createInitialMediaEditorSectionState)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [keyboardVisible, setKeyboardVisible] = useState(false)
  const [quickAddFeedback, setQuickAddFeedback] = useState<MediaEditorStatusFeedback | null>(null)
  const [selectedMetadataSource, setSelectedMetadataSource] = useState<MetadataSearchSource | null>(null)
  const [selectedTitleSnapshot, setSelectedTitleSnapshot] = useState<string | null>(null)
  const deferredTitle = useDeferredValue(draft.title)
  const titleInputRef = useRef<TextInput | null>(null)

  useEffect(() => {
    setDraft(createInitialEditorDraft(entry, mode, initialDraft))
    setExpandedSections(createInitialMediaEditorSectionState())
    setAutocompleteState(resetMediaEditorAutocompleteState())
    setQuickAddFeedback(null)
    setSelectedMetadataSource(null)
    setSelectedTitleSnapshot(null)
  }, [entry, initialDraft, mode])

  useEffect(() => {
    let active = true

    async function loadSearchResults() {
      const query = deferredTitle.trim()

      if (!shouldSearchMediaEditorAutocomplete(query)) {
        setAutocompleteState(resetMediaEditorAutocompleteState())
        return
      }

      setAutocompleteState((current) => startMediaEditorAutocompleteSearch(current))

      try {
        const results = await searchMetadata(query)

        if (!active) {
          return
        }

        startTransition(() => {
          setAutocompleteState(succeedMediaEditorAutocompleteSearch(results))
        })
      } catch (searchFailure) {
        if (active) {
          setAutocompleteState(
            failMediaEditorAutocompleteSearch(
              searchFailure instanceof Error
                ? searchFailure.message
                : "Unable to load title matches.",
            ),
          )
        }
      }
    }

    const timeout = setTimeout(() => {
      void loadSearchResults()
    }, 250)

    return () => {
      active = false
      clearTimeout(timeout)
    }
  }, [deferredTitle, searchMetadata])

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow"
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide"

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      setKeyboardVisible(true)
      setKeyboardHeight(event.endCoordinates.height)
    })

    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false)
      setKeyboardHeight(0)
    })

    return () => {
      showSubscription.remove()
      hideSubscription.remove()
    }
  }, [])

  useEffect(() => {
    if (!selectedTitleSnapshot) {
      return
    }

    if (draft.title.trim() === selectedTitleSnapshot.trim()) {
      return
    }

    setSelectedMetadataSource(null)
    setSelectedTitleSnapshot(null)
    setQuickAddFeedback(null)
  }, [draft.title, selectedTitleSnapshot])

  const conflictFields = useMemo(
    () => (pendingMetadata ? getMetadataOverrideFields(draft, pendingMetadata) : []),
    [draft, pendingMetadata],
  )

  const applyMetadata = (metadata: MediaMetadata, selectedOverrideFields: MediaMetadataOverrideField[] = []) => {
    setDraft((current) => mergeMetadataIntoDraft(current, metadata, selectedOverrideFields))
    setPendingMetadata(null)
    setOverrideFields([])
  }

  const applySelectedSearchMetadata = (metadata: MediaMetadata) => {
    setDraft((current) => applySelectedMetadataToDraft(current, metadata))
    setPendingMetadata(null)
    setOverrideFields([])
  }

  async function triggerFeedback(type: "selection" | "success" | "error") {
    if (process.env.EXPO_OS !== "ios") {
      return
    }

    if (type === "selection") {
      await Haptics.selectionAsync()
      return
    }

    await Haptics.notificationAsync(
      type === "success"
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Error,
    )
  }

  async function handleMetadataFetch(
    source: "tmdb" | "omdb",
    params?: Partial<Record<string, string>>,
    options?: { autoApplyConflicts?: boolean },
  ) {
    setMetadataLoading(true)

    try {
      const metadata = await fetchMetadata({
        source,
        title: params?.title ?? draft.title,
        imdb_id: params?.imdb_id ?? draft.imdb_id ?? undefined,
        season: params?.season ?? draft.season ?? undefined,
        type:
          params?.type ??
          (draft.medium === "TV Show" ? "series" : draft.medium === "Movie" ? "movie" : undefined),
      })

      const nextConflictFields = getMetadataOverrideFields(draft, metadata)
      const sourceLabel = getMetadataSourceFeedbackLabel(source)

      if (nextConflictFields.length) {
        if (options?.autoApplyConflicts) {
          applySelectedSearchMetadata(metadata)
          setSelectedMetadataSource(source)
          setSelectedTitleSnapshot(metadata.title ?? params?.title ?? draft.title)
          setQuickAddFeedback(createSelectedMetadataFeedback(source))
          void triggerFeedback("selection")
          return true
        }

        setPendingMetadata(metadata)
        setOverrideFields(nextConflictFields)
        setExpandedSections((current) => ({ ...current, metadata: true }))
        setQuickAddFeedback({
          message: `${sourceLabel}. Review the suggested metadata changes below.`,
          tone: "neutral",
        })
        return true
      }

      applyMetadata(metadata)
      setSelectedMetadataSource(source)
      setSelectedTitleSnapshot(metadata.title ?? params?.title ?? draft.title)
      setQuickAddFeedback({
        message: `${sourceLabel}. Draft updated with fresh metadata.`,
        tone: "success",
      })
      void triggerFeedback(options?.autoApplyConflicts ? "selection" : "success")
      return true
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : "Unable to fetch metadata."
      setQuickAddFeedback({
        message,
        tone: "error",
      })
      void triggerFeedback("error")
      return false
    } finally {
      setMetadataLoading(false)
    }
  }

  async function handleSearchResultPress(result: MetadataSearchResult) {
    const selection = resolveMediaEditorAutocompleteSelection(result)
    const didApply = await handleMetadataFetch(selection.source, selection.params, {
      autoApplyConflicts: mode === "create",
    })

    if (didApply) {
      setAutocompleteState(completeMediaEditorAutocompleteSelection())
    }
  }

  async function handlePosterUpload() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (!permission.granted) {
        Alert.alert("Photos access required", "Allow photo library access to upload a poster.")
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.9,
      })

      if (result.canceled || !result.assets[0]) {
        return
      }

      const asset = result.assets[0]
      const response = await fetch(asset.uri)
      const data = await response.arrayBuffer()
      const nextPosterUrl = await uploadPoster({
        title: draft.title,
        fileName: asset.fileName ?? "poster.jpg",
        contentType: asset.mimeType ?? "image/jpeg",
        data,
      })

      setDraft((current) => ({ ...current, poster_url: nextPosterUrl }))
    } catch (uploadError) {
      Alert.alert("Poster upload failed", uploadError instanceof Error ? uploadError.message : "Unknown error")
    }
  }

  async function handleSave() {
    setSaving(true)

    try {
      if (!draft.title.trim()) {
        setQuickAddFeedback({
          message: "Add a title before saving.",
          tone: "warning",
        })
        return
      }

      if (mode === "edit" && entry) {
        await updateEntry(entry.id, draft)
      } else {
        await createEntry(draft)
      }

      void triggerFeedback("success")
      router.back()
    } catch (saveError) {
      void triggerFeedback("error")
      Alert.alert("Unable to save", saveError instanceof Error ? saveError.message : "Unknown error")
    } finally {
      setSaving(false)
    }
  }

  const footerLayout = deriveMediaEditorFooterLayout(keyboardVisible)
  const saveFeedback = deriveMediaEditorSaveFeedback({
    draft,
    saving,
    selectedSource: selectedMetadataSource,
  })
  const selectedSourceLabel = selectedMetadataSource
    ? getMetadataSourceFeedbackLabel(selectedMetadataSource)
    : null
  const saveDisabled = saving || !draft.title.trim()
  const contentBottomPadding = Math.max(insets.bottom + 24, keyboardVisible ? keyboardHeight + 24 : 24)

  return (
    <MediaScreenScrollView
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="always"
      style={{ backgroundColor: "#F4F3EF" }}
      contentContainerStyle={{
        paddingTop: 20,
        paddingBottom: contentBottomPadding,
      }}
    >
      <MediaEditorCoreSection
        compact={keyboardVisible}
        draft={draft}
        feedback={quickAddFeedback}
        onChangeSelection={() => {
          setSelectedMetadataSource(null)
          setSelectedTitleSnapshot(null)
          setQuickAddFeedback(null)
          titleInputRef.current?.focus()
        }}
        onChangeTitle={(value) => {
          setAutocompleteState((current) => ({ ...current, error: null }))
          setDraft((current) => ({ ...current, title: value }))
        }}
        onSearchResultPress={(result) => {
          void handleSearchResultPress(result)
        }}
        searchError={autocompleteState.error}
        searchLoading={autocompleteState.loading}
        searchResults={autocompleteState.results}
        selectedSource={selectedMetadataSource}
        titleInputRef={titleInputRef}
      />

      <MediaEditorCoreDetailsSection
        compact={keyboardVisible}
        draft={draft}
        selectedSourceLabel={selectedSourceLabel}
        onSelectMedium={(value) => setDraft((current) => ({ ...current, medium: value }))}
        onSelectStatus={(value) => setDraft((current) => ({ ...current, status: value }))}
        onSelectType={(value) => setDraft((current) => ({ ...current, type: value }))}
      />

      <MediaDisclosureCard
        open={expandedSections.progress}
        subtitle="Platform, episodes, and dates"
        title="Progress & dates"
        onToggle={() =>
          setExpandedSections((current) => toggleMediaEditorSection(current, "progress"))
        }
      >
        <MediaEditorProgressSection
          draft={draft}
          platformPlaceholder={entryFieldOptions.platforms[0] ?? "Netflix"}
          onChangeEpisodes={(value) =>
            setDraft((current) => ({ ...current, episodes: toNumberOrNull(value) }))
          }
          onChangeEpisodesWatched={(value) =>
            setDraft((current) => ({ ...current, episodes_watched: toNumberOrNull(value) ?? 0 }))
          }
          onChangeFinishDate={(value) => setDraft((current) => ({ ...current, finish_date: value }))}
          onChangeLastWatchedAt={(value) => setDraft((current) => ({ ...current, last_watched_at: value }))}
          onChangePlatform={(value) => setDraft((current) => ({ ...current, platform: value }))}
          onChangeSeason={(value) => setDraft((current) => ({ ...current, season: value }))}
          onChangeStartDate={(value) => setDraft((current) => ({ ...current, start_date: value }))}
        />
      </MediaDisclosureCard>

      <MediaDisclosureCard
        open={expandedSections.ratings}
        subtitle="Ratings, runtime, language, and genres"
        title="Ratings & details"
        onToggle={() =>
          setExpandedSections((current) => toggleMediaEditorSection(current, "ratings"))
        }
      >
        <MediaEditorRatingsSection
          draft={draft}
          languagePlaceholder={entryFieldOptions.languages.slice(0, 2).join(", ") || "English"}
          onChangeAverageRating={(value) =>
            setDraft((current) => ({ ...current, average_rating: toNumberOrNull(value) }))
          }
          onChangeGenres={(value) =>
            setDraft((current) => ({
              ...current,
              genre: value
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),
            }))
          }
          onChangeLanguage={(value) =>
            setDraft((current) => ({
              ...current,
              language: value
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),
            }))
          }
          onChangeLength={(value) => setDraft((current) => ({ ...current, length: value }))}
          onChangeMyRating={(value) => setDraft((current) => ({ ...current, my_rating: toNumberOrNull(value) }))}
          onChangePrice={(value) => setDraft((current) => ({ ...current, price: toNumberOrNull(value) ?? 0 }))}
        />
      </MediaDisclosureCard>

      <MediaDisclosureCard
        open={expandedSections.metadata}
        subtitle="Metadata fetch, IMDb, and poster"
        title="Metadata & poster"
        onToggle={() =>
          setExpandedSections((current) => toggleMediaEditorSection(current, "metadata"))
        }
      >
        <MediaEditorMetadataSection
          draft={draft}
          metadataLoading={metadataLoading}
          onChangeImdbId={(value) => setDraft((current) => ({ ...current, imdb_id: value }))}
          onChangePosterUrl={(value) => setDraft((current) => ({ ...current, poster_url: value }))}
          onFetchOmdb={() => {
            void handleMetadataFetch("omdb")
          }}
          onFetchTmdb={() => {
            void handleMetadataFetch("tmdb")
          }}
          onUploadPoster={() => {
            void handlePosterUpload()
          }}
        >
          <MediaMetadataReview
            conflictFields={conflictFields}
            overrideFields={overrideFields}
            pendingMetadata={pendingMetadata}
            onToggleField={(field) =>
              setOverrideFields((current) =>
                current.includes(field)
                  ? current.filter((currentField) => currentField !== field)
                  : [...current, field],
              )
            }
            onDiscard={() => {
              setPendingMetadata(null)
              setOverrideFields([])
            }}
            onApply={() => {
              if (pendingMetadata) {
                applyMetadata(pendingMetadata, overrideFields)
                setQuickAddFeedback({
                  message: "Metadata changes applied to the draft.",
                  tone: "success",
                })
              }
            }}
          />
        </MediaEditorMetadataSection>
      </MediaDisclosureCard>

      <MediaEditorFooterActions
        compact={footerLayout === "compact"}
        disabled={saveDisabled}
        mode={mode}
        onCancel={() => router.back()}
        onSave={() => {
          void handleSave()
        }}
        saving={saving}
        statusMessage={saveFeedback.message}
        statusTone={saveFeedback.tone}
      />
    </MediaScreenScrollView>
  )
}

function createInitialEditorDraft(
  entry: MediaEntry | null | undefined,
  mode: "create" | "edit",
  initialDraft: Partial<MediaDraft> | null | undefined,
) {
  if (mode === "edit" && entry) {
    return createMediaDraftFromEntry(entry)
  }

  if (initialDraft) {
    return applyMediaDraftRules({
      ...createEmptyMediaDraft(),
      ...initialDraft,
    })
  }

  return createEmptyMediaDraft()
}
