import { ActionSheetIOS, Alert, Pressable, View } from "react-native"

import { router } from "expo-router"

import { countActiveMediaFilters } from "@/features/media/media-filter-utils"
import { useMediaDiary } from "@/features/media/media-diary-provider"
import { Symbol } from "@/components/symbol"
import { MEDIA_PRIMARY_TINT } from "@/features/media/media-ui"
import { MediaAddHeaderButton } from "@/features/media/media-search-launcher"

export function HeaderActions() {
  const { diaryEntries, filters, setActiveWatchThisEntryId } = useMediaDiary()
  const activeFilterCount = countActiveMediaFilters(filters)
  const hasPlannedEntries = diaryEntries.planned.length > 0
  const menuIcon =
    activeFilterCount > 0 ? "line.3.horizontal.decrease.circle.fill" : "ellipsis.circle"

  function openMenuActions() {
    const cancelIndex = hasPlannedEntries ? 3 : 2

    const handleIndex = (index: number) => {
      if (index === 0) {
        router.push("/media/filters")
        return
      }

      if (index === 1) {
        router.push("/media/display-preferences")
        return
      }

      if (hasPlannedEntries && index === 2) {
        const random = diaryEntries.planned[Math.floor(Math.random() * diaryEntries.planned.length)]

        if (!random) {
          return
        }

        setActiveWatchThisEntryId(random.id)
        router.push("/media/watch-this")
      }
    }

    if (process.env.EXPO_OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          cancelButtonIndex: cancelIndex,
          options: hasPlannedEntries
            ? ["Filters", "Display Preferences", "Watch This", "Cancel"]
            : ["Filters", "Display Preferences", "Cancel"],
        },
        (selectedIndex) => {
          if (selectedIndex === cancelIndex) {
            return
          }

          handleIndex(selectedIndex)
        },
      )
      return
    }

    Alert.alert("Media actions", undefined, [
      {
        text: "Filters",
        onPress: () => handleIndex(0),
      },
      {
        text: "Display Preferences",
        onPress: () => handleIndex(1),
      },
      ...(hasPlannedEntries
        ? [
            {
              text: "Watch This",
              onPress: () => handleIndex(2),
            } as const,
          ]
        : []),
      { text: "Cancel", style: "cancel" },
    ])
  }

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <MediaAddHeaderButton />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Media actions"
        hitSlop={10}
        onPress={openMenuActions}
        style={{
          width: 34,
          height: 34,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Symbol name={menuIcon} size={22} tintColor={MEDIA_PRIMARY_TINT} />
      </Pressable>
    </View>
  )
}
