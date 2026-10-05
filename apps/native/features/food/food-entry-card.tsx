import { memo } from "react"
import { Pressable, Text, View } from "react-native"

import { Image } from "expo-image"

import { formatRestaurantDisplayName, type FoodEntry } from "@analytics/domain"

import { Symbol } from "@/components/symbol"
import { MEDIA_FORM_FILL, MEDIA_PRIMARY_TINT, MEDIA_PRIMARY_TINT_MUTED } from "@/features/media/media-ui"

export const FoodEntryCard = memo(function FoodEntryCard({
  entry,
  onPress,
}: {
  entry: FoodEntry
  onPress(entryId: string): void
}) {
  const ratingLabel =
    typeof entry.overall_rating === "number" ? `${entry.overall_rating.toFixed(1)}` : null
  const priceLabel = typeof entry.total_price === "number" ? `$${entry.total_price.toFixed(2)}` : null

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(entry.id)}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingVertical: 12,
        opacity: pressed ? 0.72 : 1,
      })}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          borderCurve: "continuous",
          overflow: "hidden",
          backgroundColor: MEDIA_FORM_FILL,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {entry.primary_image_url ? (
          <Image
            source={entry.primary_image_url}
            recyclingKey={entry.id}
            cachePolicy="memory-disk"
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        ) : (
          <Symbol name="fork.knife" size={22} tintColor={MEDIA_PRIMARY_TINT_MUTED} />
        )}
      </View>

      <View style={{ flex: 1, gap: 4 }}>
        <Text selectable numberOfLines={1} style={{ fontSize: 16, fontWeight: "600", color: MEDIA_PRIMARY_TINT }}>
          {formatRestaurantDisplayName(entry)}
        </Text>
        <Text selectable numberOfLines={1} style={{ fontSize: 13, color: MEDIA_PRIMARY_TINT_MUTED }}>
          {[entry.category, entry.city].filter(Boolean).join(" · ") || "Food entry"}
        </Text>
      </View>

      <View style={{ alignItems: "flex-end", gap: 4 }}>
        {ratingLabel ? (
          <Text selectable style={{ fontSize: 13, fontWeight: "700", color: MEDIA_PRIMARY_TINT, fontVariant: ["tabular-nums"] }}>
            {ratingLabel}
          </Text>
        ) : null}
        {priceLabel ? (
          <Text selectable style={{ fontSize: 12, color: MEDIA_PRIMARY_TINT_MUTED, fontVariant: ["tabular-nums"] }}>
            {priceLabel}
          </Text>
        ) : null}
      </View>
    </Pressable>
  )
})
