import { ActivityIndicator, Pressable, Text, View } from "react-native"

import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker"

import type { MergedFoodPlaceSuggestion } from "@analytics/domain"

import { FoodChoiceRow, FoodField } from "@/features/food/food-editor-primitives"
import type { FoodFormState } from "@/features/food/food-editor-form"
import { formatReadableDate } from "@/features/food/food-ui"
import { MediaSurface } from "@/features/media/media-surface"
import { MediaTextField } from "@/features/media/primitives/media-text-field"
import { MEDIA_FORM_FILL, MEDIA_PRIMARY_TINT, MEDIA_PRIMARY_TINT_MUTED } from "@/features/media/media-ui"

function getSuggestionCaption(suggestion: MergedFoodPlaceSuggestion) {
  if (suggestion.source === "google") {
    return suggestion.subtitle || suggestion.address || "Google Places"
  }

  return (
    [suggestion.entry.category, suggestion.entry.city, suggestion.entry.address].filter(Boolean).join(" · ") ||
    "From your diary"
  )
}

export function FoodEditorCoreSection({
  form,
  mode,
  nameFocused,
  onDateChange,
  onNameBlur,
  onNameFocus,
  onSelectSuggestion,
  onToggleDatePicker,
  onUpdate,
  showDatePicker,
  suggestions,
  suggestionsLoading,
  templateEntryId,
  visitedDate,
}: {
  form: FoodFormState
  mode: "create" | "edit"
  nameFocused: boolean
  onDateChange(event: DateTimePickerEvent, nextDate?: Date): void
  onNameBlur(): void
  onNameFocus(): void
  onSelectSuggestion(suggestion: MergedFoodPlaceSuggestion): void
  onToggleDatePicker(): void
  onUpdate<K extends keyof FoodFormState>(key: K, value: FoodFormState[K]): void
  showDatePicker: boolean
  suggestions: MergedFoodPlaceSuggestion[]
  suggestionsLoading: boolean
  templateEntryId?: string
  visitedDate: Date
}) {
  return (
    <MediaSurface>
      <View style={{ gap: 4 }}>
        <Text selectable style={{ fontSize: 17, fontWeight: "700", color: MEDIA_PRIMARY_TINT }}>
          {mode === "edit" ? "Edit entry" : templateEntryId ? "Log again" : "New food entry"}
        </Text>
        <Text selectable style={{ fontSize: 14, lineHeight: 20, color: MEDIA_PRIMARY_TINT_MUTED }}>
          Start with the place and date, then add only the details you want to remember.
        </Text>
      </View>

      <FoodField label="Place name">
        <MediaTextField
          onBlur={onNameBlur}
          onChangeText={(value) => onUpdate("name", value)}
          onFocus={onNameFocus}
          placeholder="Restaurant, cafe, bar..."
          value={form.name}
        />

        {suggestionsLoading ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <ActivityIndicator color={MEDIA_PRIMARY_TINT} size="small" />
            <Text selectable style={{ fontSize: 13, color: MEDIA_PRIMARY_TINT_MUTED }}>
              Looking up places...
            </Text>
          </View>
        ) : null}

        {nameFocused && suggestions.length > 0 ? (
          <View style={{ gap: 8 }}>
            {suggestions.map((suggestion) => (
              <Pressable
                key={suggestion.id}
                accessibilityRole="button"
                onPress={() => onSelectSuggestion(suggestion)}
                style={{
                  gap: 4,
                  borderRadius: 18,
                  borderCurve: "continuous",
                  backgroundColor: MEDIA_FORM_FILL,
                  padding: 14,
                }}
              >
                <Text selectable style={{ fontSize: 15, fontWeight: "700", color: MEDIA_PRIMARY_TINT }}>
                  {suggestion.branch ? `${suggestion.name} - ${suggestion.branch}` : suggestion.name}
                </Text>
                <Text selectable style={{ fontSize: 13, lineHeight: 18, color: MEDIA_PRIMARY_TINT_MUTED }}>
                  {getSuggestionCaption(suggestion)}
                </Text>
                <Text selectable style={{ fontSize: 12, fontWeight: "700", color: MEDIA_PRIMARY_TINT_MUTED }}>
                  {suggestion.source === "google" ? "Google Places" : "From your diary"}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </FoodField>

      <FoodField label="Branch">
        <MediaTextField
          onChangeText={(value) => onUpdate("branch", value)}
          placeholder="Optional branch"
          value={form.branch}
        />
      </FoodField>

      <FoodField label="Visit date">
        <Pressable
          accessibilityRole="button"
          onPress={onToggleDatePicker}
          style={{
            borderRadius: 18,
            borderCurve: "continuous",
            backgroundColor: MEDIA_FORM_FILL,
            paddingHorizontal: 16,
            paddingVertical: 14,
          }}
        >
          <Text selectable style={{ fontSize: 16, color: MEDIA_PRIMARY_TINT }}>
            {formatReadableDate(form.visitDate)}
          </Text>
        </Pressable>
        {showDatePicker ? (
          <View
            style={{
              overflow: "hidden",
              borderRadius: 18,
              borderCurve: "continuous",
              backgroundColor: MEDIA_FORM_FILL,
            }}
          >
            <DateTimePicker
              display={process.env.EXPO_OS === "ios" ? "inline" : "default"}
              mode="date"
              onChange={onDateChange}
              value={visitedDate}
            />
          </View>
        ) : null}
      </FoodField>
    </MediaSurface>
  )
}

export function FoodEditorPlaceSection({
  autofillMessage,
  categoryOptions,
  form,
  onUpdate,
}: {
  autofillMessage?: string | null
  categoryOptions: string[]
  form: FoodFormState
  onUpdate<K extends keyof FoodFormState>(key: K, value: FoodFormState[K]): void
}) {
  return (
    <MediaSurface>
      <Text selectable style={{ fontSize: 17, fontWeight: "700", color: MEDIA_PRIMARY_TINT }}>
        Place details
      </Text>

      <FoodField label="Category">
        <MediaTextField
          onChangeText={(value) => onUpdate("category", value)}
          placeholder="Restaurant, cafe, bakery..."
          value={form.category}
        />
        <FoodChoiceRow
          onSelect={(value) => onUpdate("category", form.category === value ? "" : value)}
          options={categoryOptions}
          selectedValues={form.category ? [form.category] : []}
        />
      </FoodField>

      <FoodField label="Address">
        <MediaTextField
          multiline
          onChangeText={(value) => onUpdate("address", value)}
          placeholder="Street, district, landmarks..."
          value={form.address}
        />
      </FoodField>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <FoodField label="Neighborhood">
            <MediaTextField onChangeText={(value) => onUpdate("neighborhood", value)} value={form.neighborhood} />
          </FoodField>
        </View>
        <View style={{ flex: 1 }}>
          <FoodField label="City">
            <MediaTextField onChangeText={(value) => onUpdate("city", value)} value={form.city} />
          </FoodField>
        </View>
      </View>

      <FoodField label="Country">
        <MediaTextField onChangeText={(value) => onUpdate("country", value)} value={form.country} />
      </FoodField>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <FoodField label="Latitude">
            <MediaTextField
              keyboardType="numbers-and-punctuation"
              onChangeText={(value) => onUpdate("latitude", value)}
              value={form.latitude}
            />
          </FoodField>
        </View>
        <View style={{ flex: 1 }}>
          <FoodField label="Longitude">
            <MediaTextField
              keyboardType="numbers-and-punctuation"
              onChangeText={(value) => onUpdate("longitude", value)}
              value={form.longitude}
            />
          </FoodField>
        </View>
      </View>

      <FoodField label="Google Maps URL">
        <MediaTextField
          autoCapitalize="none"
          keyboardType="url"
          onChangeText={(value) => onUpdate("googleMapsUrl", value)}
          placeholder="https://maps.google.com/..."
          value={form.googleMapsUrl}
        />
        {autofillMessage ? (
          <Text selectable style={{ fontSize: 13, color: MEDIA_PRIMARY_TINT_MUTED }}>
            {autofillMessage}
          </Text>
        ) : null}
      </FoodField>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <FoodField label="Website">
            <MediaTextField
              autoCapitalize="none"
              keyboardType="url"
              onChangeText={(value) => onUpdate("websiteUrl", value)}
              placeholder="https://..."
              value={form.websiteUrl}
            />
          </FoodField>
        </View>
        <View style={{ flex: 1 }}>
          <FoodField label="Instagram">
            <MediaTextField
              autoCapitalize="none"
              onChangeText={(value) => onUpdate("instagramHandle", value)}
              placeholder="@handle"
              value={form.instagramHandle}
            />
          </FoodField>
        </View>
      </View>
    </MediaSurface>
  )
}
