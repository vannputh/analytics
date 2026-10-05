import { ScrollView, Switch, Text, View } from "react-native"

import { router } from "expo-router"

import { MediaButton } from "@/features/media/media-button"
import { useMediaDiary } from "@/features/media/media-diary-provider"
import { MediaSurface } from "@/features/media/media-surface"
import type { MediaDisplayPreferences } from "@/features/media/media-types"
import {
  MEDIA_FORM_FILL,
  MEDIA_PRIMARY_TINT,
  MEDIA_PRIMARY_TINT_MUTED,
  MEDIA_SHEET_BACKGROUND,
} from "@/features/media/media-ui"

const PREFERENCE_LABELS: Array<{
  key: keyof MediaDisplayPreferences
  title: string
}> = [
  { key: "showPlatform", title: "Show platform" },
  { key: "showMedium", title: "Show medium" },
  { key: "showType", title: "Show type" },
  { key: "showLanguage", title: "Show language" },
  { key: "showTimeTaken", title: "Show time taken" },
  { key: "showAverageRating", title: "Show average rating" },
  { key: "showDates", title: "Show dates" },
]

export function MediaDisplayPreferencesScreen() {
  const { displayPreferences, setDisplayPreference } = useMediaDiary()

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: MEDIA_SHEET_BACKGROUND }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 40 }}
    >
      <MediaSurface>
        <Text selectable style={{ fontSize: 17, fontWeight: "700", color: MEDIA_PRIMARY_TINT }}>
          Display preferences
        </Text>
        <Text selectable style={{ fontSize: 14, lineHeight: 20, color: MEDIA_PRIMARY_TINT_MUTED }}>
          These settings control which secondary metadata rows show up on cards and detail summaries.
        </Text>

        {PREFERENCE_LABELS.map((item) => (
          <View
            key={item.key}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              borderRadius: 18,
              borderCurve: "continuous",
              paddingHorizontal: 14,
              paddingVertical: 10,
              backgroundColor: MEDIA_FORM_FILL,
            }}
          >
            <Text selectable style={{ fontSize: 15, color: MEDIA_PRIMARY_TINT }}>
              {item.title}
            </Text>
            <Switch
              value={displayPreferences[item.key]}
              onValueChange={(value) => {
                void setDisplayPreference(item.key, value)
              }}
            />
          </View>
        ))}
      </MediaSurface>

      <MediaButton label="Done" onPress={() => router.back()} variant="primary" />
    </ScrollView>
  )
}
