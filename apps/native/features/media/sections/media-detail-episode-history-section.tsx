import { PlatformColor, Text, TextInput, View } from "react-native"

import type { EpisodeWatchRecord } from "@analytics/domain"

import { MediaButton } from "@/features/media/media-button"
import { MediaDetailSurface } from "@/features/media/components/media-detail-surface"

export function MediaDetailEpisodeHistorySection({
  editingDates,
  episodeHistory,
  onChangeDate,
  onDeleteRecord,
  onSaveDate,
}: {
  editingDates: Record<number, string>
  episodeHistory: EpisodeWatchRecord[]
  onChangeDate(index: number, value: string): void
  onDeleteRecord(index: number): void
  onSaveDate(index: number, value: string): void
}) {
  return (
    <MediaDetailSurface>
      <Text selectable style={{ fontSize: 17, fontWeight: "600", color: PlatformColor("label") }}>
        Episode history
      </Text>

      {episodeHistory.length === 0 ? (
        <Text selectable style={{ fontSize: 15, lineHeight: 22, color: PlatformColor("secondaryLabel") }}>
          No episode history recorded yet.
        </Text>
      ) : (
        <View style={{ gap: 12 }}>
          {episodeHistory.map((record, index) => (
            <View
              key={`${record.episode}-${index}`}
              style={{
                gap: 10,
                borderRadius: 14,
                borderCurve: "continuous",
                padding: 14,
                backgroundColor: PlatformColor("secondarySystemGroupedBackground"),
              }}
            >
              <Text selectable style={{ fontSize: 15, fontWeight: "600", color: PlatformColor("label") }}>
                Episode {record.episode}
              </Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={PlatformColor("secondaryLabel") as unknown as string}
                value={editingDates[index] ?? record.watched_at.slice(0, 10)}
                onChangeText={(value) => onChangeDate(index, value)}
                style={{
                  borderRadius: 12,
                  borderCurve: "continuous",
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  backgroundColor: PlatformColor("systemBackground"),
                  fontSize: 15,
                  color: PlatformColor("label"),
                }}
              />
              <View style={{ flexDirection: "row", gap: 10 }}>
                <MediaButton
                  label="Save date"
                  onPress={() => onSaveDate(index, editingDates[index] ?? record.watched_at.slice(0, 10))}
                  size="compact"
                  style={{ flex: 1 }}
                  variant="primary"
                />
                <MediaButton
                  label="Delete record"
                  onPress={() => onDeleteRecord(index)}
                  size="compact"
                  style={{ flex: 1 }}
                  variant="destructive"
                />
              </View>
            </View>
          ))}
        </View>
      )}
    </MediaDetailSurface>
  )
}
