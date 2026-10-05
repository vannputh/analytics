import type { MediaEntry } from "./database.types"

export interface MediaDiaryEntries {
  watching: MediaEntry[]
  watched: MediaEntry[]
  planned: MediaEntry[]
  holdAndDropped: MediaEntry[]
}

const WATCHING_STATUSES = new Set(["Watching", "Currently Watching", "watching"])
const WATCHED_STATUSES = new Set(["Finished", "watched"])
const PLANNED_STATUSES = new Set(["Plan to Watch", "Planned", "planned"])
const HOLD_AND_DROPPED_STATUSES = new Set(["On Hold", "Dropped", "on hold", "dropped"])

function toTimestamp(value: string | null | undefined) {
  if (!value) {
    return 0
  }

  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? 0 : timestamp
}

function compareDateDesc(
  leftValue: string | null | undefined,
  rightValue: string | null | undefined,
) {
  return toTimestamp(rightValue) - toTimestamp(leftValue)
}

export function partitionMediaDiaryEntries(entries: MediaEntry[]): MediaDiaryEntries {
  return {
    watching: entries
      .filter((entry) => (entry.status ? WATCHING_STATUSES.has(entry.status) : false))
      .sort((left, right) => {
        const lastWatchedComparison = compareDateDesc(left.last_watched_at, right.last_watched_at)
        if (lastWatchedComparison !== 0) {
          return lastWatchedComparison
        }

        return compareDateDesc(left.updated_at, right.updated_at)
      }),
    watched: entries
      .filter((entry) => (entry.status ? WATCHED_STATUSES.has(entry.status) : false))
      .sort((left, right) => compareDateDesc(left.finish_date, right.finish_date)),
    planned: entries.filter((entry) => (entry.status ? PLANNED_STATUSES.has(entry.status) : false)),
    holdAndDropped: entries.filter((entry) =>
      entry.status ? HOLD_AND_DROPPED_STATUSES.has(entry.status) : false,
    ),
  }
}
