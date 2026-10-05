import { useEffect, useMemo, useState } from "react"
import { Alert, PlatformColor, ScrollView, Text, View } from "react-native"

import * as Clipboard from "expo-clipboard"
import * as Haptics from "expo-haptics"
import { Image } from "expo-image"
import * as Linking from "expo-linking"
import { router, Stack } from "expo-router"

import {
  DINING_OPTIONS,
  formatDualCurrency,
  formatRestaurantDisplayName,
  type FoodEntryImage,
  type ItemOrdered,
} from "@analytics/domain"

import { useFoodDiary } from "@/features/food/food-diary-provider"
import { formatLocalDateKey, formatReadableDate } from "@/features/food/food-ui"
import { MediaButton } from "@/features/media/media-button"
import { MediaEmptyState } from "@/features/media/primitives/media-empty-state"
import { MediaScreenScrollView } from "@/features/media/primitives/media-screen-scroll-view"
import { MediaSurface } from "@/features/media/media-surface"
import { MEDIA_FORM_FILL, MEDIA_PRIMARY_TINT, MEDIA_PRIMARY_TINT_MUTED } from "@/features/media/media-ui"

function SummaryRow({ label, value }: { label: string; value: string | null }) {
  if (!value) {
    return null
  }

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 16,
        paddingVertical: 12,
      }}
    >
      <Text selectable style={{ fontSize: 13, fontWeight: "700", color: MEDIA_PRIMARY_TINT_MUTED }}>
        {label}
      </Text>
      <Text
        selectable
        style={{ flex: 1, textAlign: "right", fontSize: 15, lineHeight: 22, color: MEDIA_PRIMARY_TINT }}
      >
        {value}
      </Text>
    </View>
  )
}

function getDiningLabel(value: string | null | undefined) {
  return DINING_OPTIONS.find((option) => option.value === value)?.label ?? value ?? null
}

function getLocationLabel(entry: {
  address: string | null
  branch: string | null
  city: string | null
  neighborhood: string | null
}) {
  return [entry.branch, entry.neighborhood, entry.city, entry.address].filter(Boolean).join(" · ") || null
}

function getImageList(entry: { images?: FoodEntryImage[]; primary_image_url?: string | null }): FoodEntryImage[] {
  if (entry.images?.length) {
    return entry.images
  }

  if (!entry.primary_image_url) {
    return []
  }

  return [
    {
      id: "primary-image",
      food_entry_id: "primary-image",
      storage_path: "",
      image_url: entry.primary_image_url,
      is_primary: true,
      caption: null,
      user_id: "",
      created_at: "",
    },
  ]
}

function formatItemCategories(item: ItemOrdered) {
  return item.categories?.length ? item.categories.join(", ") : item.category
}

async function openExternalUrl(url: string, label: string) {
  try {
    await Linking.openURL(url)
  } catch {
    Alert.alert("Unable to open link", `Could not open the ${label.toLowerCase()} link.`)
  }
}

async function copyText(value: string) {
  try {
    await Clipboard.setStringAsync(value)

    if (process.env.EXPO_OS === "ios") {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    }
  } catch {
    Alert.alert("Unable to copy", "Could not copy that value to the clipboard.")
  }
}

export function FoodDetailScreen({ entryId }: { entryId: string }) {
  const { deleteEntry, getEntryById, loadEntryDetail } = useFoodDiary()
  const [loadingDetail, setLoadingDetail] = useState(false)

  const entry = getEntryById(entryId)
  const imageList = useMemo(() => (entry ? getImageList(entry) : []), [entry])

  useEffect(() => {
    let active = true

    async function ensureDetail() {
      if (!entryId) {
        return
      }

      setLoadingDetail(true)
      try {
        await loadEntryDetail(entryId)
      } finally {
        if (active) {
          setLoadingDetail(false)
        }
      }
    }

    if (!entry || entry.images === undefined) {
      void ensureDetail()
    }

    return () => {
      active = false
    }
  }, [entry, entryId, loadEntryDetail])

  if (!entry) {
    return (
      <MediaScreenScrollView style={{ backgroundColor: PlatformColor("systemGroupedBackground") }}>
        <MediaEmptyState
          body={
            loadingDetail
              ? "Loading the latest food entry details."
              : "This entry may have been deleted or has not loaded yet."
          }
          loading={loadingDetail}
          title={loadingDetail ? "Loading entry" : "Entry not found"}
        />
      </MediaScreenScrollView>
    )
  }

  const currentEntry = entry
  const title = formatRestaurantDisplayName(currentEntry)
  const locationLabel = getLocationLabel(currentEntry)
  const ratingLabel =
    typeof currentEntry.overall_rating === "number"
      ? `${currentEntry.overall_rating.toFixed(1)} / 5 overall`
      : null
  const priceLabel = formatDualCurrency(currentEntry.total_price)

  function handleLogAgain() {
    if (process.env.EXPO_OS === "ios") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }

    router.push({
      pathname: "/food/add",
      params: {
        date: formatLocalDateKey(),
        templateId: currentEntry.id,
      },
    })
  }

  function handleDelete() {
    Alert.alert("Delete entry", `Delete ${title}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          if (process.env.EXPO_OS === "ios") {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
          }

          void deleteEntry(currentEntry.id).then(() => {
            router.back()
          })
        },
      },
    ])
  }

  return (
    <>
      <Stack.Screen options={{ title }} />
      <MediaScreenScrollView
        style={{ backgroundColor: PlatformColor("systemGroupedBackground") }}
        contentContainerStyle={{ gap: 16, paddingBottom: 40 }}
      >
        <MediaSurface>
          <View
            style={{
              width: "100%",
              aspectRatio: 1.4,
              borderRadius: 22,
              borderCurve: "continuous",
              overflow: "hidden",
              backgroundColor: MEDIA_FORM_FILL,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {imageList[0] ? (
              <Image source={imageList[0].image_url} style={{ width: "100%", height: "100%" }} contentFit="cover" />
            ) : (
              <Image source="sf:fork.knife" style={{ width: 44, height: 44, tintColor: MEDIA_PRIMARY_TINT_MUTED }} />
            )}
          </View>

          <View style={{ gap: 6 }}>
            <Text selectable style={{ fontSize: 24, fontWeight: "700", color: MEDIA_PRIMARY_TINT }}>
              {title}
            </Text>
            <Text selectable style={{ fontSize: 15, lineHeight: 22, color: MEDIA_PRIMARY_TINT_MUTED }}>
              {[currentEntry.category, getDiningLabel(currentEntry.dining_type), locationLabel]
                .filter(Boolean)
                .join(" · ") || "Food entry"}
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <MediaButton
              label="Edit"
              onPress={() => router.push(`/food/entry/${currentEntry.id}/edit`)}
              style={{ flex: 1 }}
              variant="primary"
            />
            <MediaButton label="Log Again" onPress={handleLogAgain} style={{ flex: 1 }} variant="secondary" />
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {currentEntry.google_maps_url ? (
              <MediaButton
                label="Open Maps"
                onPress={() => {
                  void openExternalUrl(currentEntry.google_maps_url!, "Maps")
                }}
                size="compact"
                variant="chip"
              />
            ) : null}
            {currentEntry.website_url ? (
              <MediaButton
                label="Website"
                onPress={() => {
                  void openExternalUrl(currentEntry.website_url!, "Website")
                }}
                size="compact"
                variant="chip"
              />
            ) : null}
            {currentEntry.instagram_handle ? (
              <MediaButton
                label={`@${currentEntry.instagram_handle.replace(/^@/, "")}`}
                onPress={() => {
                  void openExternalUrl(
                    `https://instagram.com/${currentEntry.instagram_handle!.replace(/^@/, "")}`,
                    "Instagram",
                  )
                }}
                size="compact"
                variant="chip"
              />
            ) : null}
            {currentEntry.address ? (
              <MediaButton
                label="Copy Address"
                onPress={() => {
                  void copyText(currentEntry.address!)
                }}
                size="compact"
                variant="chip"
              />
            ) : null}
            {currentEntry.google_maps_url ? (
              <MediaButton
                label="Copy Maps Link"
                onPress={() => {
                  void copyText(currentEntry.google_maps_url!)
                }}
                size="compact"
                variant="chip"
              />
            ) : null}
          </View>
        </MediaSurface>

        <MediaSurface gap={0}>
          <Text selectable style={{ fontSize: 17, fontWeight: "700", color: MEDIA_PRIMARY_TINT, paddingBottom: 4 }}>
            Overview
          </Text>
          <SummaryRow label="Visited" value={formatReadableDate(currentEntry.visit_date)} />
          <SummaryRow label="Location" value={locationLabel} />
          <SummaryRow label="Cuisine" value={currentEntry.cuisine_type?.join(", ") ?? null} />
          <SummaryRow label="Favorite item" value={currentEntry.favorite_item} />
          <SummaryRow label="Ratings" value={ratingLabel} />
          <SummaryRow label="Price" value={priceLabel === "—" ? null : priceLabel} />
          <SummaryRow
            label="Return"
            value={
              currentEntry.would_return === null
                ? null
                : currentEntry.would_return
                  ? "Would return"
                  : "Would not return"
            }
          />
        </MediaSurface>

        {(currentEntry.food_rating ||
          currentEntry.ambiance_rating ||
          currentEntry.service_rating ||
          currentEntry.value_rating ||
          currentEntry.tags?.length) ? (
          <MediaSurface gap={0}>
            <Text selectable style={{ fontSize: 17, fontWeight: "700", color: MEDIA_PRIMARY_TINT, paddingBottom: 4 }}>
              Details
            </Text>
            <SummaryRow
              label="Sub-ratings"
              value={
                [
                  typeof currentEntry.food_rating === "number" ? `Food ${currentEntry.food_rating.toFixed(1)}` : null,
                  typeof currentEntry.ambiance_rating === "number"
                    ? `Ambiance ${currentEntry.ambiance_rating.toFixed(1)}`
                    : null,
                  typeof currentEntry.service_rating === "number"
                    ? `Service ${currentEntry.service_rating.toFixed(1)}`
                    : null,
                  typeof currentEntry.value_rating === "number"
                    ? `Value ${currentEntry.value_rating.toFixed(1)}`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || null
              }
            />
            <SummaryRow label="Tags" value={currentEntry.tags?.join(", ") ?? null} />
          </MediaSurface>
        ) : null}

        {currentEntry.items_ordered?.length ? (
          <MediaSurface>
            <Text selectable style={{ fontSize: 17, fontWeight: "700", color: MEDIA_PRIMARY_TINT }}>
              Items
            </Text>
            <View style={{ gap: 12 }}>
              {currentEntry.items_ordered.map((item: ItemOrdered, index: number) => (
                <View
                  key={`${item.name}-${index}`}
                  style={{
                    gap: 4,
                    borderRadius: 18,
                    borderCurve: "continuous",
                    backgroundColor: MEDIA_FORM_FILL,
                    padding: 14,
                  }}
                >
                  <Text selectable style={{ fontSize: 15, fontWeight: "700", color: MEDIA_PRIMARY_TINT }}>
                    {item.name}
                  </Text>
                  <Text selectable style={{ fontSize: 13, color: MEDIA_PRIMARY_TINT_MUTED }}>
                    {[formatItemCategories(item), typeof item.price === "number" ? `$${item.price.toFixed(2)}` : null]
                      .filter(Boolean)
                      .join(" · ") || "No extra item details"}
                  </Text>
                </View>
              ))}
            </View>
          </MediaSurface>
        ) : null}

        {imageList.length > 1 ? (
          <MediaSurface>
            <Text selectable style={{ fontSize: 17, fontWeight: "700", color: MEDIA_PRIMARY_TINT }}>
              Photos
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {imageList.map((image, index) => (
                <View
                  key={`${image.id}-${index}`}
                  style={{
                    width: 220,
                    height: 160,
                    borderRadius: 20,
                    borderCurve: "continuous",
                    overflow: "hidden",
                    backgroundColor: MEDIA_FORM_FILL,
                  }}
                >
                  <Image source={image.image_url} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                </View>
              ))}
            </ScrollView>
          </MediaSurface>
        ) : null}

        {currentEntry.notes ? (
          <MediaSurface>
            <Text selectable style={{ fontSize: 17, fontWeight: "700", color: MEDIA_PRIMARY_TINT }}>
              Notes
            </Text>
            <Text selectable style={{ fontSize: 15, lineHeight: 22, color: MEDIA_PRIMARY_TINT_MUTED }}>
              {currentEntry.notes}
            </Text>
          </MediaSurface>
        ) : null}

        <MediaButton fullWidth label="Delete Entry" onPress={handleDelete} variant="destructive" />
      </MediaScreenScrollView>
    </>
  )
}
