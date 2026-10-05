import { useEffect, useMemo, useState } from "react"
import { Alert, PlatformColor, Text } from "react-native"
import { router } from "expo-router"

import {
  formatDate,
  getMetadataOverrideFields,
  getTimeTaken,
  mergeMetadataIntoDraft,
  parseEpisodeHistory,
  type MediaMetadata,
  type MediaMetadataOverrideField,
} from "@analytics/domain"

import { MediaDetailSurface } from "@/features/media/components/media-detail-surface"
import { MediaMetadataReview } from "@/features/media/media-metadata-review"
import { useMediaDiary } from "@/features/media/media-diary-provider"
import { MediaScreenScrollView } from "@/features/media/primitives/media-screen-scroll-view"
import { MediaDetailEpisodeHistorySection } from "@/features/media/sections/media-detail-episode-history-section"
import { MediaDetailHeroSection } from "@/features/media/sections/media-detail-hero-section"
import { MediaDetailMetadataSection } from "@/features/media/sections/media-detail-metadata-section"
import { MediaDetailQuickActionsSection } from "@/features/media/sections/media-detail-quick-actions-section"
import { MediaDetailStatusHistorySection } from "@/features/media/sections/media-detail-status-history-section"
import { MediaDetailSummarySection } from "@/features/media/sections/media-detail-summary-section"

export function MediaDetailScreen({ entryId }: { entryId: string }) {
  const {
    deleteEpisodeHistoryAt,
    deleteEntry,
    displayPreferences,
    fetchMetadata,
    getEntryById,
    getStatusHistory,
    loading,
    restartEntry,
    updateEntry,
    updateWatchingDate,
    updateWatchingProgress,
  } = useMediaDiary()

  const entry = getEntryById(entryId)
  const [statusHistory, setStatusHistory] = useState<string[]>([])
  const [pendingMetadata, setPendingMetadata] = useState<MediaMetadata | null>(null)
  const [overrideFields, setOverrideFields] = useState<MediaMetadataOverrideField[]>([])
  const [metadataLoading, setMetadataLoading] = useState(false)
  const [editingDates, setEditingDates] = useState<Record<number, string>>({})

  const episodeHistory = useMemo(() => (entry ? parseEpisodeHistory(entry.episode_history) : []), [entry])
  const conflictFields = useMemo(
    () => (entry && pendingMetadata ? getMetadataOverrideFields(entry, pendingMetadata) : []),
    [entry, pendingMetadata],
  )

  useEffect(() => {
    let active = true

    async function loadHistory() {
      if (!entry) {
        return
      }

      try {
        const history = await getStatusHistory(entry.id)

        if (active) {
          setStatusHistory(
            history.map((item) => `${item.new_status} • ${formatDate(item.changed_at)}`),
          )
        }
      } catch {
        if (active) {
          setStatusHistory([])
        }
      }
    }

    void loadHistory()

    return () => {
      active = false
    }
  }, [entry, getStatusHistory])

  if (!entry) {
    if (loading) {
      return (
        <MediaScreenScrollView
          style={{ backgroundColor: PlatformColor("systemGroupedBackground") }}
          contentContainerStyle={{ paddingTop: 20, paddingBottom: 20 }}
        >
          <MediaDetailSurface>
            <Text selectable style={{ fontSize: 17, fontWeight: "600", color: PlatformColor("label") }}>
              Loading entry…
            </Text>
          </MediaDetailSurface>
        </MediaScreenScrollView>
      )
    }

    return (
      <MediaScreenScrollView
        style={{ backgroundColor: PlatformColor("systemGroupedBackground") }}
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 20 }}
      >
        <MediaDetailSurface>
          <Text selectable style={{ fontSize: 17, fontWeight: "600", color: PlatformColor("label") }}>
            Entry not found
          </Text>
          <Text selectable style={{ fontSize: 15, lineHeight: 22, color: PlatformColor("secondaryLabel") }}>
            This entry may have been deleted or has not loaded yet.
          </Text>
        </MediaDetailSurface>
      </MediaScreenScrollView>
    )
  }

  const currentEntry = entry
  const timeTaken = getTimeTaken(currentEntry.time_taken, currentEntry.start_date, currentEntry.finish_date)

  async function handleMetadataFetch(source: "tmdb" | "omdb") {
    setMetadataLoading(true)

    try {
          const metadata = await fetchMetadata({
            source,
            title: currentEntry.title,
            imdb_id: currentEntry.imdb_id ?? undefined,
            season: currentEntry.season ?? undefined,
            type:
              currentEntry.medium === "TV Show"
                ? "series"
                : currentEntry.medium === "Movie"
                  ? "movie"
                  : undefined,
          })

      const nextConflictFields = getMetadataOverrideFields(currentEntry, metadata)

      if (nextConflictFields.length) {
        setPendingMetadata(metadata)
        setOverrideFields(nextConflictFields)
      } else {
        await updateEntry(currentEntry.id, mergeMetadataIntoDraft(currentEntry, metadata))
      }
    } catch (metadataError) {
      Alert.alert("Metadata fetch failed", metadataError instanceof Error ? metadataError.message : "Unknown error")
    } finally {
      setMetadataLoading(false)
    }
  }

  return (
    <MediaScreenScrollView
      style={{ backgroundColor: PlatformColor("systemGroupedBackground") }}
      contentContainerStyle={{ paddingTop: 20 }}
    >
      <MediaDetailHeroSection
        entry={currentEntry}
        onDelete={() =>
          Alert.alert("Delete entry", `Delete ${currentEntry.title}?`, [
            { style: "cancel", text: "Cancel" },
            {
              style: "destructive",
              text: "Delete",
              onPress: () => {
                void deleteEntry(currentEntry.id).then(() => router.back())
              },
            },
          ])
        }
        onEdit={() => router.push(`/media/entry/${currentEntry.id}/edit`)}
        onRestart={() => {
          void restartEntry(currentEntry.id)
        }}
      />

      <MediaDetailSummarySection
        displayPreferences={displayPreferences}
        entry={currentEntry}
        timeTaken={timeTaken}
      />

      {currentEntry.status === "Watching" || currentEntry.status === "Currently Watching" ? (
        <MediaDetailQuickActionsSection
          onDecrement={() => {
            void updateWatchingProgress(currentEntry.id, "decrement")
          }}
          onIncrement={() => {
            void updateWatchingProgress(currentEntry.id, "increment")
          }}
        />
      ) : null}

      <MediaDetailEpisodeHistorySection
        editingDates={editingDates}
        episodeHistory={episodeHistory}
        onChangeDate={(index, value) =>
          setEditingDates((current) => ({
            ...current,
            [index]: value,
          }))
        }
        onDeleteRecord={(index) => {
          void deleteEpisodeHistoryAt(currentEntry.id, index)
        }}
        onSaveDate={(index, value) => {
          void updateWatchingDate(currentEntry.id, {
            date: value,
            episodeHistoryIndex: index,
          })
        }}
      />

      <MediaDetailMetadataSection
        loading={metadataLoading}
        onFetchOmdb={() => {
          void handleMetadataFetch("omdb")
        }}
        onFetchTmdb={() => {
          void handleMetadataFetch("tmdb")
        }}
      >
        <MediaMetadataReview
          conflictFields={conflictFields}
          overrideFields={overrideFields}
          pendingMetadata={pendingMetadata}
          onToggleField={(field) =>
            setOverrideFields((current) =>
              current.includes(field)
                ? current.filter((currentField) => currentField !== field)
                : [...current, field],
            )
          }
          onDiscard={() => {
            setPendingMetadata(null)
            setOverrideFields([])
          }}
          onApply={() => {
            if (!pendingMetadata) {
              return
            }

            void updateEntry(
              currentEntry.id,
              mergeMetadataIntoDraft(currentEntry, pendingMetadata, overrideFields),
            ).then(() => {
              setPendingMetadata(null)
              setOverrideFields([])
            })
          }}
        />
      </MediaDetailMetadataSection>

      <MediaDetailStatusHistorySection statusHistory={statusHistory} />
    </MediaScreenScrollView>
  )
}
