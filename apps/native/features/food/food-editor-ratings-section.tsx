import { Pressable, Switch, Text, View } from "react-native"

import { CURRENCIES, DINING_OPTIONS, FOOD_TAGS, PRICE_LEVELS } from "@analytics/domain"

import { FoodChoiceRow, FoodField, FoodRatingSelector } from "@/features/food/food-editor-primitives"
import type { FoodFormState } from "@/features/food/food-editor-form"
import { toggleValue } from "@/features/food/food-editor-form"
import { MediaButton } from "@/features/media/media-button"
import { MediaSurface } from "@/features/media/media-surface"
import { MediaTextField } from "@/features/media/primitives/media-text-field"
import { MEDIA_FORM_FILL, MEDIA_PRIMARY_TINT, MEDIA_PRIMARY_TINT_MUTED } from "@/features/media/media-ui"

export function FoodEditorRatingsSection({
  form,
  onUpdate,
}: {
  form: FoodFormState
  onUpdate<K extends keyof FoodFormState>(key: K, value: FoodFormState[K]): void
}) {
  return (
    <MediaSurface>
      <Text selectable style={{ fontSize: 17, fontWeight: "700", color: MEDIA_PRIMARY_TINT }}>
        Ratings and spend
      </Text>

      <FoodRatingSelector label="Overall" onChange={(value) => onUpdate("overallRating", value)} value={form.overallRating} />
      <FoodRatingSelector label="Food" onChange={(value) => onUpdate("foodRating", value)} value={form.foodRating} />
      <FoodRatingSelector label="Ambiance" onChange={(value) => onUpdate("ambianceRating", value)} value={form.ambianceRating} />
      <FoodRatingSelector label="Service" onChange={(value) => onUpdate("serviceRating", value)} value={form.serviceRating} />
      <FoodRatingSelector label="Value" onChange={(value) => onUpdate("valueRating", value)} value={form.valueRating} />

      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <FoodField label="Total price">
            <MediaTextField
              keyboardType="numbers-and-punctuation"
              onChangeText={(value) => onUpdate("totalPrice", value)}
              placeholder="0.00"
              value={form.totalPrice}
            />
          </FoodField>
        </View>
        <View style={{ flex: 1 }}>
          <FoodField label="Currency">
            <FoodChoiceRow
              onSelect={(value) => onUpdate("currency", value)}
              options={CURRENCIES}
              selectedValues={[form.currency]}
            />
          </FoodField>
        </View>
      </View>

      <FoodField label="Price level">
        <FoodChoiceRow
          onSelect={(value) => onUpdate("priceLevel", form.priceLevel === value ? "" : value)}
          options={PRICE_LEVELS}
          selectedValues={form.priceLevel ? [form.priceLevel] : []}
        />
      </FoodField>

      <FoodField label="Would you return?">
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderRadius: 18,
            borderCurve: "continuous",
            backgroundColor: MEDIA_FORM_FILL,
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
        >
          <View style={{ flex: 1, gap: 4, paddingRight: 12 }}>
            <Text selectable style={{ fontSize: 15, fontWeight: "600", color: MEDIA_PRIMARY_TINT }}>
              {form.wouldReturn === false ? "Not this time" : "Mark as worth returning"}
            </Text>
            <Text selectable style={{ fontSize: 13, lineHeight: 18, color: MEDIA_PRIMARY_TINT_MUTED }}>
              Toggle on for a definite return. Leave it off if you are still deciding.
            </Text>
          </View>
          <Switch
            ios_backgroundColor="#D1D5DB"
            onValueChange={(value) => onUpdate("wouldReturn", value)}
            thumbColor="#FFFFFF"
            trackColor={{ false: "#D1D5DB", true: MEDIA_PRIMARY_TINT }}
            value={Boolean(form.wouldReturn)}
          />
        </View>
        {form.wouldReturn === false ? (
          <Pressable accessibilityRole="button" onPress={() => onUpdate("wouldReturn", null)}>
            <Text selectable style={{ fontSize: 13, fontWeight: "700", color: MEDIA_PRIMARY_TINT_MUTED }}>
              Clear decision
            </Text>
          </Pressable>
        ) : null}
      </FoodField>
    </MediaSurface>
  )
}

export function FoodEditorClassificationSection({
  cuisineOptions,
  form,
  onUpdate,
}: {
  cuisineOptions: string[]
  form: FoodFormState
  onUpdate<K extends keyof FoodFormState>(key: K, value: FoodFormState[K]): void
}) {
  return (
    <MediaSurface>
      <Text selectable style={{ fontSize: 17, fontWeight: "700", color: MEDIA_PRIMARY_TINT }}>
        Classification
      </Text>

      <FoodField label="Dining type">
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {DINING_OPTIONS.map((option) => (
            <MediaButton
              key={option.value}
              label={option.label}
              onPress={() => onUpdate("diningType", form.diningType === option.value ? "" : option.value)}
              selected={form.diningType === option.value}
              size="compact"
              variant="chip"
            />
          ))}
        </View>
      </FoodField>

      <FoodField label="Cuisine types">
        <FoodChoiceRow
          onSelect={(value) => onUpdate("cuisineTypes", toggleValue(form.cuisineTypes, value))}
          options={cuisineOptions}
          selectedValues={form.cuisineTypes}
        />
      </FoodField>

      <FoodField label="Tags">
        <FoodChoiceRow
          onSelect={(value) => onUpdate("tags", toggleValue(form.tags, value))}
          options={FOOD_TAGS}
          selectedValues={form.tags}
        />
      </FoodField>
    </MediaSurface>
  )
}
