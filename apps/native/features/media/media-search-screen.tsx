import { startTransition, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react"
import { FlatList, Platform, PlatformColor, Text, View } from "react-native"

import { router, Stack, useFocusEffect } from "expo-router"
import type { SearchBarCommands } from "react-native-screens"

import { AdaptiveGlass } from "@/components/adaptive-glass"
import { Symbol } from "@/components/symbol"
import { createMediaAppStoreHeaderOptions } from "@/features/media/media-app-store-header"
import { useMediaDiary } from "@/features/media/media-diary-provider"
import {
  deriveMediaSearchPresentationState,
  type MediaSearchFallbackState,
} from "@/features/media/media-search-presentation"
import { MediaTextField } from "@/features/media/primitives/media-text-field"
import { createMediaSearchListItemFromEntryResult } from "@/features/media/media-search-list-item"
import { MediaSearchResultRow } from "@/features/media/media-search-result-row"
import { deriveMediaSearchState } from "@/features/media/media-search-state"
import { MediaSurface } from "@/features/media/media-surface"

export function MediaSearchScreen() {
  const { allEntries, filters, searchMetadata } = useMediaDiary()
  const [query, setQuery] = useState("")
  const [fallbackState, setFallbackState] = useState<MediaSearchFallbackState>({
    error: null,
    loading: false,
    results: [],
  })
  const deferredQuery = useDeferredValue(query)
  const usesHeaderSearch = Platform.OS === "ios"
  const searchBarRef = useRef<SearchBarCommands>(null)

  useFocusEffect(
    useCallback(() => {
      if (!usesHeaderSearch) return
      const timer = setTimeout(() => {
        searchBarRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }, [usesHeaderSearch]),
  )

  const searchState = useMemo(
    () => deriveMediaSearchState(allEntries, filters, deferredQuery, "all"),
    [allEntries, deferredQuery, filters],
  )
  const presentation = useMemo(
    () =>
      deriveMediaSearchPresentationState({
        fallback: fallbackState,
        localResults: searchState.results,
        normalizedQuery: searchState.normalizedQuery,
      }),
    [fallbackState, searchState.normalizedQuery, searchState.results],
  )

  const recentItems = useMemo(() => {
    if (searchState.normalizedQuery) return []

    const topRecent = [...allEntries]
      .sort((a, b) => {
        const aDate = new Date(a.updated_at || a.created_at || 0).getTime()
        const bDate = new Date(b.updated_at || b.created_at || 0).getTime()
        return bDate - aDate
      })
      .slice(0, 5)

    return topRecent.map((entry) => {
      const item = createMediaSearchListItemFromEntryResult({
        entry,
        matchKind: "secondary-field",
        matchedField: "status",
      })
      item.detailLabel = "Recent addition"
      return item
    })
  }, [allEntries, searchState.normalizedQuery])

  useEffect(() => {
    let active = true

    if (!presentation.shouldFetchFallback) {
      setFallbackState((current) =>
        current.error || current.loading || current.results.length > 0
          ? { error: null, loading: false, results: [] }
          : current,
      )
      return () => {
        active = false
      }
    }

    setFallbackState((current) => ({ ...current, error: null, loading: true, results: [] }))

    async function loadFallbackResults() {
      try {
        const results = await searchMetadata(searchState.normalizedQuery)

        if (!active) {
          return
        }

        startTransition(() => {
          setFallbackState({
            error: null,
            loading: false,
            results,
          })
        })
      } catch (error) {
        if (!active) {
          return
        }

        setFallbackState({
          error: error instanceof Error ? error.message : "Unable to load API matches.",
          loading: false,
          results: [],
        })
      }
    }

    void loadFallbackResults()

    return () => {
      active = false
    }
  }, [presentation.shouldFetchFallback, searchMetadata, searchState.normalizedQuery])

  function openEntry(entryId: string) {
    router.push(`/media/entry/${entryId}`)
  }

  function openExternalResult(item: (typeof presentation.items)[number]) {
    router.push({
      params: {
        imdbId: item.prefillImdbId,
        mediaType: item.prefillMediaType,
        title: item.title,
      },
      pathname: "/media/add",
    })
  }

  const showResultsSummary = searchState.isActive && presentation.items.length > 0

  const listHeader = (
    <View style={{ gap: 14, paddingBottom: 12 }}>
      {(!usesHeaderSearch || showResultsSummary) ? (
        <MediaSurface glass>
          <View style={{ gap: 14 }}>
            {!usesHeaderSearch && (
              <AdaptiveGlass
                isInteractive
                style={{
                  borderRadius: 16,
                  borderCurve: "continuous",
                  flexDirection: "row",
                  alignItems: "center",
                  minHeight: 48,
                  paddingHorizontal: 12,
                  gap: 8,
                }}
              >
                <Symbol name="magnifyingglass" size={16} tintColor={PlatformColor("secondaryLabel")} />
                <MediaTextField
                  autoCapitalize="none"
                  clearButtonMode="while-editing"
                  onChangeText={setQuery}
                  placeholder="Search"
                  returnKeyType="search"
                  style={{
                    flex: 1,
                    fontSize: 17,
                    backgroundColor: "transparent",
                    minHeight: 40,
                    paddingHorizontal: 0,
                    paddingVertical: 8,
                  }}
                  value={query}
                />
              </AdaptiveGlass>
            )}

            {showResultsSummary ? (
              <Text selectable style={{ fontSize: 13, color: PlatformColor("secondaryLabel") }}>
                {presentation.summary}
              </Text>
            ) : null}
          </View>
        </MediaSurface>
      ) : null}

      {!searchState.isActive && recentItems.length > 0 && (
        <View style={{ paddingHorizontal: 4, marginTop: usesHeaderSearch ? 4 : 0 }}>
          <Text selectable style={{ fontSize: 20, fontWeight: "700", color: PlatformColor("label") }}>
            Recent Additions
          </Text>
        </View>
      )}
    </View>
  )

  const listEmpty = searchState.normalizedQuery ? (
    <MediaSurface glass>
      <View style={{ gap: 4 }}>
        <Text selectable style={{ fontSize: 15, fontWeight: "700", color: PlatformColor("label") }}>
          {presentation.emptyTitle}
        </Text>
        {presentation.emptyDetail ? (
          <Text selectable style={{ fontSize: 14, color: PlatformColor("secondaryLabel") }}>
            {presentation.emptyDetail}
          </Text>
        ) : null}
      </View>
    </MediaSurface>
  ) : (
    <MediaSurface glass>
      <View style={{ gap: 4 }}>
        <Text selectable style={{ fontSize: 17, fontWeight: "700", color: PlatformColor("label") }}>
          Search your diary
        </Text>
        <Text selectable style={{ fontSize: 14, color: PlatformColor("secondaryLabel") }}>
          Jump to any movie or show across your entire media diary.
        </Text>
      </View>
    </MediaSurface>
  )

  const headerOptions = useMemo(
    () =>
      createMediaAppStoreHeaderOptions({
        title: "Search",
        headerLargeTitle: usesHeaderSearch,
        headerSearchBarOptions: usesHeaderSearch
          ? {
              ref: searchBarRef,
              autoFocus: true,
              autoCapitalize: "none",
              cancelButtonText: "Cancel",
              hideWhenScrolling: false,
              obscureBackground: false,
              onCancelButtonPress: () => {
                setQuery("")
              },
              onChangeText: (event: { nativeEvent: { text: string } }) => {
                setQuery(event.nativeEvent.text)
              },
              onSearchButtonPress: (event: { nativeEvent: { text: string } }) => {
                setQuery(event.nativeEvent.text)
              },
              placeholder: "Search",
              placement: "stacked",
            }
          : undefined,
      }),
    [usesHeaderSearch],
  )

  return (
    <>
      <Stack.Screen options={headerOptions} />
      <FlatList
        style={{ flex: 1, backgroundColor: PlatformColor("systemGroupedBackground") }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 18, paddingTop: usesHeaderSearch ? 24 : 18, gap: 12, paddingBottom: 40 }}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="always"
        data={searchState.isActive ? presentation.items : recentItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MediaSearchResultRow
            item={item}
            onPress={() => {
              if (item.kind === "local" && item.localEntryId) {
                openEntry(item.localEntryId)
                return
              }

              openExternalResult(item)
            }}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
      />
    </>
  )
}
