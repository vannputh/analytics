import { Platform } from "react-native"

import { router, Stack } from "expo-router"

import { createMediaAppStoreHeaderOptions } from "@/features/media/media-app-store-header"
import { countActiveMediaFilters } from "@/features/media/media-filter-utils"
import { useMediaDiary } from "@/features/media/media-diary-provider"
import { HeaderActions } from "@/features/media/media-header-actions"

export function MediaDiaryHeader() {
  const { diaryEntries, filters, setActiveWatchThisEntryId } = useMediaDiary()
  const activeFilterCount = countActiveMediaFilters(filters)
  const hasPlannedEntries = diaryEntries.planned.length > 0
  const filterSubtitle = activeFilterCount > 0 ? `${activeFilterCount} active` : undefined

  function openWatchThis() {
    const random = diaryEntries.planned[Math.floor(Math.random() * diaryEntries.planned.length)]

    if (!random) {
      return
    }

    setActiveWatchThisEntryId(random.id)
    router.push("/media/watch-this")
  }

  if (Platform.OS !== "ios") {
    return (
      <Stack.Screen
        options={createMediaAppStoreHeaderOptions({
          title: "Media",
          headerLargeTitle: true,
          headerRight: () => <HeaderActions />,
        })}
      />
    )
  }

  return (
    <>
      <Stack.Screen
        options={createMediaAppStoreHeaderOptions({})}
      />
      <Stack.Screen.Title large largeStyle={{ color: "#111111", fontSize: 34, fontWeight: "800" }}>
        Media
      </Stack.Screen.Title>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          accessibilityLabel="Add media entry"
          icon="plus"
          onPress={() => router.push("/media/add")}
        />
        <Stack.Toolbar.Menu accessibilityLabel="Media actions" icon="ellipsis" title="Media">
          <Stack.Toolbar.MenuAction
            icon="line.3.horizontal.decrease"
            onPress={() => router.push("/media/filters")}
            subtitle={filterSubtitle}
          >
            Filters
          </Stack.Toolbar.MenuAction>
          <Stack.Toolbar.MenuAction
            icon="slider.horizontal.3"
            onPress={() => router.push("/media/display-preferences")}
          >
            Display Preferences
          </Stack.Toolbar.MenuAction>
          {hasPlannedEntries ? (
            <Stack.Toolbar.MenuAction
              icon="shuffle"
              onPress={openWatchThis}
            >
              Watch This
            </Stack.Toolbar.MenuAction>
          ) : null}
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>
    </>
  )
}
