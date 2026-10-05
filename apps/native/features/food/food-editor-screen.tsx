import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { ActivityIndicator, Alert, PlatformColor, Text, View } from "react-native"

import type { DateTimePickerEvent } from "@react-native-community/datetimepicker"
import * as Haptics from "expo-haptics"
import * as ImagePicker from "expo-image-picker"
import { router } from "expo-router"

import {
  CATEGORIES,
  CUISINE_TYPES,
  GOOGLE_PLACE_SEARCH_FALLBACK_THRESHOLD,
  isGoogleMapsLookupUrl,
  mapPlaceDetailsToAutofillPatch,
  mergeFoodPlaceSuggestions,
  type FoodEntryInsert,
  type MergedFoodPlaceSuggestion,
} from "@analytics/domain"

import { useFoodDiary } from "@/features/food/food-diary-provider"
import {
  applyPlaceDetailsPatch,
  applyPlaceSuggestion,
  buildFoodPayload,
  createEmptyFormState,
  createEmptyItemDraft,
  createFormStateFromSource,
  isValidDateKey,
  parseDateKey,
  type FoodFormState,
  type FoodItemDraft,
} from "@/features/food/food-editor-form"
import { FoodEditorCoreSection, FoodEditorPlaceSection } from "@/features/food/food-editor-core-section"
import { FoodEditorPhotosSection } from "@/features/food/food-editor-photos-section"
import {
  FoodEditorClassificationSection,
  FoodEditorRatingsSection,
} from "@/features/food/food-editor-ratings-section"
import {
  FoodEditorFooterSection,
  FoodEditorItemsSection,
  FoodEditorNotesSection,
} from "@/features/food/food-editor-items-section"
import {
  buildMapsAuthHeaders,
  buildPlacePhotoUrl,
  fetchPlaceDetailsFromApi,
  searchPlacesFromApi,
} from "@/features/food/food-place-maps-client"
import {
  createGooglePhotoDrafts,
  createStoredPhotoDrafts,
  mergePlacePhotoDrafts,
  type FoodPlacePhotoDraft,
} from "@/features/food/food-place-photos"
import { formatLocalDateKey, formatReadableDate } from "@/features/food/food-ui"
import { MediaEmptyState } from "@/features/media/primitives/media-empty-state"
import { MediaScreenScrollView } from "@/features/media/primitives/media-screen-scroll-view"
import { MediaSurface } from "@/features/media/media-surface"
import { MEDIA_PRIMARY_TINT } from "@/features/media/media-ui"

function buildAutofillRequestKey(url?: string, placeId?: string) {
  return `${placeId?.trim().toLowerCase() || ""}|${url?.trim().toLowerCase() || ""}`
}

export function FoodEditorScreen({
  entryId,
  initialDate,
  mode,
  templateEntryId,
}: {
  entryId?: string
  initialDate?: string
  mode: "create" | "edit"
  templateEntryId?: string
}) {
  const {
    createDuplicateDraft,
    createEntry,
    fieldOptions,
    getEntryById,
    insertPlaceImage,
    loadEntryDetail,
    lookupLocalPlaces,
    setSelectedDate,
    updateEntry,
    uploadPlaceImage,
  } = useFoodDiary()

  const resolvedInitialDate = initialDate && isValidDateKey(initialDate) ? initialDate : formatLocalDateKey()
  const [form, setForm] = useState<FoodFormState>(() => createEmptyFormState(resolvedInitialDate))
  const [loadingSource, setLoadingSource] = useState(mode === "edit" || Boolean(templateEntryId))
  const [saving, setSaving] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [nameFocused, setNameFocused] = useState(false)
  const [suggestions, setSuggestions] = useState<MergedFoodPlaceSuggestion[]>([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [photoDrafts, setPhotoDrafts] = useState<FoodPlacePhotoDraft[]>([])
  const [autofillMessage, setAutofillMessage] = useState<string | null>(null)
  const lastAutofillKeyRef = useRef<string | null>(null)
  const applyingAutofillRef = useRef(false)

  const deferredQuery = useDeferredValue(form.name)
  const currentEntry = mode === "edit" && entryId ? getEntryById(entryId) : null

  const categoryOptions = useMemo(
    () => Array.from(new Set([...CATEGORIES, ...fieldOptions.categories])).sort(),
    [fieldOptions.categories],
  )
  const cuisineOptions = useMemo(
    () => Array.from(new Set([...CUISINE_TYPES, ...fieldOptions.cuisineTypes])).sort(),
    [fieldOptions.cuisineTypes],
  )
  const itemCategoryOptions = useMemo(() => fieldOptions.itemCategories, [fieldOptions.itemCategories])

  useEffect(() => {
    let active = true

    async function bootstrap() {
      setLoadingSource(true)

      try {
        if (mode === "edit" && entryId) {
          const entry = (await loadEntryDetail(entryId)) ?? getEntryById(entryId)
          if (active) {
            setForm(createFormStateFromSource(entry, resolvedInitialDate))
            setPhotoDrafts(entry && "images" in entry && entry.images ? createStoredPhotoDrafts(entry.images) : [])
            lastAutofillKeyRef.current = buildAutofillRequestKey(entry?.google_maps_url ?? "")
          }
          return
        }

        if (mode === "create" && templateEntryId) {
          const draft = await createDuplicateDraft(templateEntryId, resolvedInitialDate)
          if (active) {
            setForm(createFormStateFromSource(draft, resolvedInitialDate))
            lastAutofillKeyRef.current = buildAutofillRequestKey(draft?.google_maps_url ?? "")
          }
          return
        }

        if (active) {
          setForm(createEmptyFormState(resolvedInitialDate))
          setPhotoDrafts([])
        }
      } catch (bootstrapError) {
        if (active) {
          Alert.alert(
            "Unable to prepare form",
            bootstrapError instanceof Error ? bootstrapError.message : "Unknown error",
          )
        }
      } finally {
        if (active) {
          setLoadingSource(false)
        }
      }
    }

    void bootstrap()

    return () => {
      active = false
    }
  }, [createDuplicateDraft, entryId, getEntryById, loadEntryDetail, mode, resolvedInitialDate, templateEntryId])

  useEffect(() => {
    let active = true

    async function loadSuggestions() {
      const query = deferredQuery.trim()

      if (!nameFocused || query.length < 2) {
        setSuggestions([])
        setSuggestionsLoading(false)
        return
      }

      setSuggestionsLoading(true)

      try {
        const localResults = await lookupLocalPlaces(query)
        if (!active) {
          return
        }

        const local = localResults.filter((entry) => entry.id !== entryId)

        if (mode === "edit" || local.length >= GOOGLE_PLACE_SEARCH_FALLBACK_THRESHOLD) {
          startTransition(() => {
            setSuggestions(mergeFoodPlaceSuggestions(local, []))
          })
          return
        }

        try {
          const googleResults = await searchPlacesFromApi(query)
          if (!active) {
            return
          }

          startTransition(() => {
            setSuggestions(mergeFoodPlaceSuggestions(local, googleResults))
          })
        } catch {
          if (active) {
            startTransition(() => {
              setSuggestions(mergeFoodPlaceSuggestions(local, []))
            })
          }
        }
      } catch {
        if (active) {
          setSuggestions([])
        }
      } finally {
        if (active) {
          setSuggestionsLoading(false)
        }
      }
    }

    const timeout = setTimeout(() => {
      void loadSuggestions()
    }, 250)

    return () => {
      active = false
      clearTimeout(timeout)
    }
  }, [deferredQuery, entryId, lookupLocalPlaces, mode, nameFocused])

  useEffect(() => {
    if (applyingAutofillRef.current) {
      return
    }

    const mapsUrl = form.googleMapsUrl.trim()
    if (!isGoogleMapsLookupUrl(mapsUrl)) {
      return
    }

    const requestKey = buildAutofillRequestKey(mapsUrl)
    if (requestKey === lastAutofillKeyRef.current) {
      return
    }

    let active = true
    const timeout = setTimeout(() => {
      void (async () => {
        setAutofillMessage("Filling from Maps...")

        try {
          const details = await fetchPlaceDetailsFromApi({ url: mapsUrl })
          if (!active) {
            return
          }

          const patch = mapPlaceDetailsToAutofillPatch(details)
          applyingAutofillRef.current = true
          setForm((current) => applyPlaceDetailsPatch(current, patch))
          setPhotoDrafts((current) => mergePlacePhotoDrafts(current, createGooglePhotoDrafts(patch.photos)))
          lastAutofillKeyRef.current = buildAutofillRequestKey(patch.googleMapsUrl || mapsUrl)
          setAutofillMessage("Filled from Google Maps")
        } catch (autofillError) {
          if (active) {
            setAutofillMessage(
              autofillError instanceof Error ? autofillError.message : "Unable to autofill from Maps",
            )
          }
        } finally {
          applyingAutofillRef.current = false
        }
      })()
    }, 500)

    return () => {
      active = false
      clearTimeout(timeout)
    }
  }, [form.googleMapsUrl])

  const visitedDate = parseDateKey(form.visitDate)
  const saveLabel = mode === "edit" ? "Save Changes" : templateEntryId ? "Log Entry" : "Create Entry"

  function updateForm<K extends keyof FoodFormState>(key: K, value: FoodFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function updateItem(index: number, patch: Partial<FoodItemDraft>) {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    }))
  }

  function addItem() {
    setForm((current) => ({
      ...current,
      items: [...current.items, createEmptyItemDraft()],
    }))
  }

  function removeItem(index: number) {
    setForm((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  async function applyGoogleSuggestion(suggestion: Extract<MergedFoodPlaceSuggestion, { source: "google" }>) {
    const details = await fetchPlaceDetailsFromApi({
      placeId: suggestion.placeId ?? suggestion.id,
      url: suggestion.googleMapsUrl ?? undefined,
    })
    const patch = mapPlaceDetailsToAutofillPatch(details)
    applyingAutofillRef.current = true
    setForm((current) => applyPlaceDetailsPatch(current, patch))
    setPhotoDrafts((current) => mergePlacePhotoDrafts(current, createGooglePhotoDrafts(patch.photos)))
    lastAutofillKeyRef.current = buildAutofillRequestKey(
      patch.googleMapsUrl || suggestion.googleMapsUrl || "",
      suggestion.placeId ?? suggestion.id,
    )
    setAutofillMessage("Filled from Google Places")
    applyingAutofillRef.current = false
  }

  async function handleSelectSuggestion(suggestion: MergedFoodPlaceSuggestion) {
    if (process.env.EXPO_OS === "ios") {
      void Haptics.selectionAsync()
    }

    setNameFocused(false)
    setSuggestions([])

    if (suggestion.source === "local") {
      applyingAutofillRef.current = true
      setForm((current) => applyPlaceSuggestion(current, suggestion.entry))
      lastAutofillKeyRef.current = buildAutofillRequestKey(suggestion.entry.google_maps_url ?? "")
      applyingAutofillRef.current = false
      return
    }

    try {
      await applyGoogleSuggestion(suggestion)
    } catch (autofillError) {
      Alert.alert(
        "Unable to autofill place",
        autofillError instanceof Error ? autofillError.message : "Unknown error",
      )
    }
  }

  async function handleAddFromLibrary() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (!permission.granted) {
        Alert.alert("Photos access required", "Allow photo library access to add a place photo.")
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.9,
      })

      if (result.canceled || !result.assets[0]) {
        return
      }

      const asset = result.assets[0]
      setPhotoDrafts((current) => [
        ...current,
        {
          id: `library-${Date.now()}`,
          kind: "library",
          uri: asset.uri,
          mimeType: asset.mimeType ?? "image/jpeg",
          fileName: asset.fileName ?? "place.jpg",
        },
      ])
    } catch (pickerError) {
      Alert.alert(
        "Unable to add photo",
        pickerError instanceof Error ? pickerError.message : "Unknown error",
      )
    }
  }

  async function persistPlacePhotos(savedEntryId: string, drafts: FoodPlacePhotoDraft[]) {
    let primaryImageUrl: string | null = null

    for (const [index, draft] of drafts.entries()) {
      if (draft.kind === "stored") {
        if (index === 0) {
          primaryImageUrl = draft.imageUrl
        }
        continue
      }

      const sourceUri =
        draft.kind === "library" ? draft.uri : buildPlacePhotoUrl(draft.photoName, 800)
      const response = await fetch(
        sourceUri,
        draft.kind === "google" ? { headers: await buildMapsAuthHeaders() } : undefined,
      )

      if (!response.ok) {
        throw new Error("Unable to read a place photo for upload.")
      }

      const data = await response.arrayBuffer()
      const contentType =
        draft.kind === "library" ? draft.mimeType : response.headers.get("content-type") || "image/jpeg"
      const fileName = draft.kind === "library" ? draft.fileName : "place.jpg"
      const uploaded = await uploadPlaceImage({
        entryId: savedEntryId,
        contentType,
        fileName,
        data,
      })

      await insertPlaceImage({
        food_entry_id: savedEntryId,
        image_url: uploaded.publicUrl,
        storage_path: uploaded.path,
        is_primary: index === 0,
        caption: null,
      })

      if (index === 0) {
        primaryImageUrl = uploaded.publicUrl
      }
    }

    if (primaryImageUrl) {
      await updateEntry(savedEntryId, { primary_image_url: primaryImageUrl })
    }
  }

  function handleDateChange(_: DateTimePickerEvent, nextDate?: Date) {
    if (process.env.EXPO_OS !== "ios") {
      setShowDatePicker(false)
    }

    if (nextDate) {
      updateForm("visitDate", formatLocalDateKey(nextDate))
    }
  }

  async function handleSave() {
    if (!form.name.trim()) {
      Alert.alert("Name required", "Add a place name before saving.")
      return
    }

    if (!isValidDateKey(form.visitDate)) {
      Alert.alert("Valid date required", "Choose a visit date before saving.")
      return
    }

    const payload = buildFoodPayload(form)
    setSaving(true)

    try {
      const saved =
        mode === "edit" && entryId
          ? await updateEntry(entryId, payload)
          : await createEntry(payload as FoodEntryInsert)

      await persistPlacePhotos(saved.id, photoDrafts)
      setSelectedDate(payload.visit_date)

      if (process.env.EXPO_OS === "ios") {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      }

      router.back()
    } catch (saveError) {
      Alert.alert("Unable to save", saveError instanceof Error ? saveError.message : "Unknown error")
    } finally {
      setSaving(false)
    }
  }

  if (loadingSource) {
    return (
      <MediaScreenScrollView style={{ backgroundColor: PlatformColor("systemGroupedBackground") }}>
        <MediaSurface>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <ActivityIndicator color={MEDIA_PRIMARY_TINT} />
            <Text selectable style={{ fontSize: 16, fontWeight: "700", color: MEDIA_PRIMARY_TINT }}>
              Preparing entry form...
            </Text>
          </View>
        </MediaSurface>
      </MediaScreenScrollView>
    )
  }

  if (mode === "edit" && entryId && !currentEntry) {
    return (
      <MediaScreenScrollView style={{ backgroundColor: PlatformColor("systemGroupedBackground") }}>
        <MediaEmptyState
          body="This food entry could not be loaded for editing."
          title="Entry not found"
        />
      </MediaScreenScrollView>
    )
  }

  return (
    <MediaScreenScrollView
      style={{ backgroundColor: PlatformColor("systemGroupedBackground") }}
      contentContainerStyle={{ paddingBottom: 40, gap: 16 }}
      keyboardDismissMode="interactive"
    >
      <FoodEditorCoreSection
        form={form}
        mode={mode}
        nameFocused={nameFocused}
        onDateChange={handleDateChange}
        onNameBlur={() => {
          setTimeout(() => {
            setNameFocused(false)
          }, 120)
        }}
        onNameFocus={() => setNameFocused(true)}
        onSelectSuggestion={(suggestion) => {
          void handleSelectSuggestion(suggestion)
        }}
        onToggleDatePicker={() => setShowDatePicker((current) => !current)}
        onUpdate={updateForm}
        showDatePicker={showDatePicker}
        suggestions={suggestions}
        suggestionsLoading={suggestionsLoading}
        templateEntryId={templateEntryId}
        visitedDate={visitedDate}
      />
      <FoodEditorPlaceSection
        autofillMessage={autofillMessage}
        categoryOptions={categoryOptions}
        form={form}
        onUpdate={updateForm}
      />
      <FoodEditorPhotosSection
        onAddFromLibrary={() => {
          void handleAddFromLibrary()
        }}
        onRemoveDraft={(id) => {
          setPhotoDrafts((current) => current.filter((draft) => draft.id !== id))
        }}
        photoDrafts={photoDrafts}
      />
      <FoodEditorRatingsSection form={form} onUpdate={updateForm} />
      <FoodEditorClassificationSection cuisineOptions={cuisineOptions} form={form} onUpdate={updateForm} />
      <FoodEditorItemsSection
        form={form}
        itemCategoryOptions={itemCategoryOptions}
        onAddItem={addItem}
        onRemoveItem={removeItem}
        onUpdate={updateForm}
        onUpdateItem={updateItem}
      />
      <FoodEditorNotesSection form={form} onUpdate={updateForm} />
      <FoodEditorFooterSection
        dateLabel={formatReadableDate(form.visitDate)}
        mode={mode}
        onCancel={() => router.back()}
        onSave={() => {
          void handleSave()
        }}
        saveLabel={saveLabel}
        saving={saving}
      />
    </MediaScreenScrollView>
  )
}
