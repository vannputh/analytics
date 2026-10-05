import { Text, View } from "react-native"

import type { FoodFormState, FoodItemDraft } from "@/features/food/food-editor-form"
import { FoodChoiceRow, FoodField } from "@/features/food/food-editor-primitives"
import { MediaButton } from "@/features/media/media-button"
import { MediaSurface } from "@/features/media/media-surface"
import { MediaTextField } from "@/features/media/primitives/media-text-field"
import { MEDIA_FORM_FILL, MEDIA_PRIMARY_TINT, MEDIA_PRIMARY_TINT_MUTED } from "@/features/media/media-ui"

export function FoodEditorItemsSection({
  form,
  itemCategoryOptions,
  onAddItem,
  onRemoveItem,
  onUpdate,
  onUpdateItem,
}: {
  form: FoodFormState
  itemCategoryOptions: string[]
  onAddItem(): void
  onRemoveItem(index: number): void
  onUpdate<K extends keyof FoodFormState>(key: K, value: FoodFormState[K]): void
  onUpdateItem(index: number, patch: Partial<FoodItemDraft>): void
}) {
  return (
    <MediaSurface>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <Text selectable style={{ fontSize: 17, fontWeight: "700", color: MEDIA_PRIMARY_TINT }}>
          Items
        </Text>
        <MediaButton label="Add Item" onPress={onAddItem} size="compact" variant="secondary" />
      </View>

      {form.items.length === 0 ? (
        <Text selectable style={{ fontSize: 14, lineHeight: 20, color: MEDIA_PRIMARY_TINT_MUTED }}>
          Add individual items when you want more precise spend and favorites later.
        </Text>
      ) : null}

      {form.items.map((item, index) => (
        <View
          key={index}
          style={{
            gap: 12,
            borderRadius: 20,
            borderCurve: "continuous",
            backgroundColor: MEDIA_FORM_FILL,
            padding: 14,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <Text selectable style={{ fontSize: 15, fontWeight: "700", color: MEDIA_PRIMARY_TINT }}>
              {item.name.trim() || `Item ${index + 1}`}
            </Text>
            <MediaButton label="Remove" onPress={() => onRemoveItem(index)} size="compact" variant="destructive" />
          </View>

          <FoodField label="Name">
            <MediaTextField onChangeText={(value) => onUpdateItem(index, { name: value })} value={item.name} />
          </FoodField>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <FoodField label="Price">
                <MediaTextField
                  keyboardType="numbers-and-punctuation"
                  onChangeText={(value) => onUpdateItem(index, { price: value })}
                  value={item.price}
                />
              </FoodField>
            </View>
            <View style={{ flex: 1 }}>
              <FoodField label="Primary category">
                <MediaTextField
                  onChangeText={(value) => onUpdateItem(index, { category: value })}
                  value={item.category}
                />
              </FoodField>
            </View>
          </View>

          {itemCategoryOptions.length > 0 ? (
            <FoodChoiceRow
              onSelect={(value) =>
                onUpdateItem(index, {
                  category: item.category === value ? "" : value,
                })
              }
              options={itemCategoryOptions}
              selectedValues={item.category ? [item.category] : []}
            />
          ) : null}

          <FoodField label="Extra categories" description="Comma separated, for analytics grouping.">
            <MediaTextField
              onChangeText={(value) => onUpdateItem(index, { categoriesText: value })}
              placeholder="Noodles, Dessert, Brunch"
              value={item.categoriesText}
            />
          </FoodField>
        </View>
      ))}

      <FoodField label="Favorite item">
        <MediaTextField
          onChangeText={(value) => onUpdate("favoriteItem", value)}
          placeholder="Best thing you ordered"
          value={form.favoriteItem}
        />
      </FoodField>
    </MediaSurface>
  )
}

export function FoodEditorNotesSection({
  form,
  onUpdate,
}: {
  form: FoodFormState
  onUpdate<K extends keyof FoodFormState>(key: K, value: FoodFormState[K]): void
}) {
  return (
    <MediaSurface>
      <Text selectable style={{ fontSize: 17, fontWeight: "700", color: MEDIA_PRIMARY_TINT }}>
        Notes
      </Text>
      <FoodField label="Notes">
        <MediaTextField
          multiline
          onChangeText={(value) => onUpdate("notes", value)}
          placeholder="Anything worth remembering..."
          value={form.notes}
        />
      </FoodField>
    </MediaSurface>
  )
}

export function FoodEditorFooterSection({
  dateLabel,
  mode,
  onCancel,
  onSave,
  saving,
  saveLabel,
}: {
  dateLabel: string
  mode: "create" | "edit"
  onCancel(): void
  onSave(): void
  saving: boolean
  saveLabel: string
}) {
  return (
    <MediaSurface>
      <View style={{ gap: 4 }}>
        <Text selectable style={{ fontSize: 15, fontWeight: "700", color: MEDIA_PRIMARY_TINT }}>
          {dateLabel}
        </Text>
        <Text selectable style={{ fontSize: 13, lineHeight: 18, color: MEDIA_PRIMARY_TINT_MUTED }}>
          {mode === "edit"
            ? "Changes save back to this existing entry."
            : "Core diary fields, local suggestions, and item breakdowns save with this entry."}
        </Text>
      </View>

      <MediaButton disabled={saving} fullWidth label={saving ? "Saving..." : saveLabel} onPress={onSave} variant="primary" />
      <MediaButton disabled={saving} fullWidth label="Cancel" onPress={onCancel} variant="secondary" />
    </MediaSurface>
  )
}
