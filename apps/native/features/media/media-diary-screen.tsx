import { PlatformColor, RefreshControl } from "react-native"

import { router } from "expo-router"

import { useMediaDiary } from "@/features/media/media-diary-provider"
import { MediaScreenScrollView } from "@/features/media/primitives/media-screen-scroll-view"
import { MediaDiaryActiveAreaPanel } from "@/features/media/sections/media-diary-active-area-panel"
import { MediaDiaryAreaSwitcher } from "@/features/media/sections/media-diary-area-switcher"
import { MediaDiaryEmptyState } from "@/features/media/sections/media-diary-empty-state"
import { MEDIA_PRIMARY_TINT } from "@/features/media/media-ui"

export function MediaDiaryScreen() {
  const {
    activeArea,
    allEntries,
    diaryEntries,
    displayPreferences,
    error,
    loading,
    refreshing,
    refreshEntries,
    setActiveArea,
    updateWatchingProgress,
    watchedEntries,
  } = useMediaDiary()

  function openEntry(entryId: string) {
    router.push(`/media/entry/${entryId}`)
  }

  return (
    <>
      <MediaScreenScrollView
        style={{ backgroundColor: PlatformColor("systemGroupedBackground") }}
        contentContainerStyle={{
          paddingBottom: 42,
          gap: 24,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={MEDIA_PRIMARY_TINT}
            onRefresh={() => {
              void refreshEntries()
            }}
          />
        }
      >
        {loading && allEntries.length === 0 ? (
          <>
            <MediaDiaryAreaSwitcher activeArea={activeArea} onChange={setActiveArea} />
            <MediaDiaryActiveAreaPanel
              activeArea={activeArea}
              diaryEntries={diaryEntries}
              displayPreferences={displayPreferences}
              loading
              onIncrementWatching={(entryId) => updateWatchingProgress(entryId, "increment")}
              onOpenEntry={openEntry}
              watchedEntries={watchedEntries}
            />
          </>
        ) : allEntries.length === 0 ? (
          <MediaDiaryEmptyState error={error} loading={loading} />
        ) : (
          <>
            <MediaDiaryAreaSwitcher activeArea={activeArea} onChange={setActiveArea} />
            <MediaDiaryActiveAreaPanel
              activeArea={activeArea}
              diaryEntries={diaryEntries}
              displayPreferences={displayPreferences}
              loading={loading && allEntries.length === 0}
              onIncrementWatching={(entryId) => updateWatchingProgress(entryId, "increment")}
              onOpenEntry={openEntry}
              watchedEntries={watchedEntries}
            />
          </>
        )}
      </MediaScreenScrollView>
    </>
  )
}
