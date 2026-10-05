import { Pressable, ScrollView, Text, View } from "react-native"

import { Image } from "expo-image"

import { useAuth } from "@/components/auth-provider"
import { FoodField } from "@/features/food/food-editor-primitives"
import type { FoodPlacePhotoDraft } from "@/features/food/food-place-photos"
import { canRemovePlacePhotoDraft } from "@/features/food/food-place-photos"
import { buildPlacePhotoUrl } from "@/features/food/food-place-maps-client"
import { MediaButton } from "@/features/media/media-button"
import { MediaSurface } from "@/features/media/media-surface"
import { MEDIA_FORM_FILL, MEDIA_PRIMARY_TINT, MEDIA_PRIMARY_TINT_MUTED } from "@/features/media/media-ui"

function getDraftPreviewSource(draft: FoodPlacePhotoDraft, accessToken: string | null) {
  if (draft.kind === "library") {
    return draft.uri
  }

  if (draft.kind === "stored") {
    return draft.imageUrl
  }

  return {
    uri: buildPlacePhotoUrl(draft.photoName, 400),
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  }
}

function getDraftCaption(draft: FoodPlacePhotoDraft, index: number) {
  if (index === 0) {
    return "Primary"
  }

  if (draft.kind === "google") {
    return "Google"
  }

  if (draft.kind === "library") {
    return "Library"
  }

  return "Saved"
}

export function FoodEditorPhotosSection({
  onAddFromLibrary,
  onRemoveDraft,
  photoDrafts,
}: {
  onAddFromLibrary(): void
  onRemoveDraft(id: string): void
  photoDrafts: FoodPlacePhotoDraft[]
}) {
  const { session } = useAuth()
  const accessToken = session?.access_token ?? null

  return (
    <MediaSurface>
      <View style={{ gap: 4 }}>
        <Text selectable style={{ fontSize: 17, fontWeight: "700", color: MEDIA_PRIMARY_TINT }}>
          Place photos
        </Text>
        <Text selectable style={{ fontSize: 14, lineHeight: 20, color: MEDIA_PRIMARY_TINT_MUTED }}>
          Add a photo from your library or keep Google previews. The first photo becomes the primary image.
        </Text>
      </View>

      <FoodField label="Photos">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
          {photoDrafts.map((draft, index) => (
            <View key={draft.id} style={{ width: 132, gap: 8 }}>
              <View
                style={{
                  width: 132,
                  height: 96,
                  overflow: "hidden",
                  borderRadius: 18,
                  borderCurve: "continuous",
                  backgroundColor: MEDIA_FORM_FILL,
                }}
              >
                <Image
                  source={getDraftPreviewSource(draft, accessToken)}
                  recyclingKey={draft.id}
                  cachePolicy="memory-disk"
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
              </View>
              <Text selectable style={{ fontSize: 12, fontWeight: "700", color: MEDIA_PRIMARY_TINT_MUTED }}>
                {getDraftCaption(draft, index)}
              </Text>
              {canRemovePlacePhotoDraft(draft) ? (
                <Pressable accessibilityRole="button" onPress={() => onRemoveDraft(draft.id)}>
                  <Text style={{ fontSize: 13, color: MEDIA_PRIMARY_TINT }}>Remove</Text>
                </Pressable>
              ) : null}
            </View>
          ))}
        </ScrollView>
        <MediaButton label="Add from Library" onPress={onAddFromLibrary} size="compact" variant="secondary" />
      </FoodField>
    </MediaSurface>
  )
}
