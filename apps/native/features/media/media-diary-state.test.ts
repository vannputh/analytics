import assert from "node:assert/strict"
import { describe, it } from "node:test"

import type { MediaEntry } from "@analytics/domain"
import { defaultFilterState } from "@analytics/domain"

import {
  DEFAULT_MEDIA_DIARY_AREA,
  deriveMediaDiaryState,
  getMediaDiaryAreaContext,
  normalizeMediaDiaryArea,
} from "@/features/media/media-diary-state"

function createMediaEntry(id: string, overrides: Partial<MediaEntry> = {}): MediaEntry {
  return {
    id,
    title: `Entry ${id}`,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    status: null,
    medium: "Movie",
    type: "Movie",
    ...overrides,
  } as MediaEntry
}

describe("native media diary state", () => {
  it("keeps diary state focused on sections and watched filtering instead of search state", () => {
    const result = deriveMediaDiaryState(
      [
        createMediaEntry("watching", { status: "Watching", title: "Orbit" }),
        createMediaEntry("finished", {
          status: "Finished",
          title: "Moonrise",
          genre: ["Drama"],
          finish_date: "2026-01-10",
        }),
      ],
      {
        ...defaultFilterState,
        genres: ["Drama"],
      },
    )

    assert.deepEqual(Object.keys(result).sort(), ["diaryEntries", "filterOptions", "watchedEntries"])
    assert.deepEqual(result.watchedEntries.map((entry) => entry.id), ["finished"])
    assert.ok(!("filteredWatched" in result))
    assert.ok(!("searchQuery" in result))
  })

  it("defaults the active area to watched when the saved value is missing or invalid", () => {
    assert.equal(normalizeMediaDiaryArea(undefined), DEFAULT_MEDIA_DIARY_AREA)
    assert.equal(normalizeMediaDiaryArea("archive"), DEFAULT_MEDIA_DIARY_AREA)
  })

  it("restores a valid saved active area", () => {
    assert.equal(normalizeMediaDiaryArea("backlog"), "planned")
    assert.equal(normalizeMediaDiaryArea("planned"), "planned")
    assert.equal(normalizeMediaDiaryArea("holdAndDropped"), "paused")
    assert.equal(normalizeMediaDiaryArea("dropped"), "dropped")
  })

  it("derives selected-area context metadata for queue, paused, and dropped areas", () => {
    const result = deriveMediaDiaryState(
      [
        createMediaEntry("watching", { status: "Watching", title: "Orbit" }),
        createMediaEntry("finished", { status: "Finished", title: "Moonrise" }),
        createMediaEntry("planned", { status: "Planned", title: "Queue" }),
        createMediaEntry("on-hold", { status: "On Hold", title: "Paused" }),
        createMediaEntry("dropped", { status: "Dropped", title: "Archive" }),
      ],
      defaultFilterState,
    )

    const watching = getMediaDiaryAreaContext("watching", result.diaryEntries, result.watchedEntries)
    const watched = getMediaDiaryAreaContext("watched", result.diaryEntries, result.watchedEntries)
    const planned = getMediaDiaryAreaContext("planned", result.diaryEntries, result.watchedEntries)
    const paused = getMediaDiaryAreaContext("paused", result.diaryEntries, result.watchedEntries)
    const dropped = getMediaDiaryAreaContext("dropped", result.diaryEntries, result.watchedEntries)

    assert.equal(watching.count, 1)
    assert.equal(watching.title, "Watching Now")
    assert.equal(watched.count, 1)
    assert.equal(watched.actionLabel, undefined)
    assert.equal(planned.count, 1)
    assert.equal(planned.actionLabel, "Watch This")
    assert.equal(planned.title, "Queue")
    assert.equal(paused.count, 1)
    assert.equal(paused.actionLabel, undefined)
    assert.equal(paused.title, "Paused")
    assert.equal(dropped.count, 1)
    assert.equal(dropped.actionLabel, undefined)
    assert.equal(dropped.title, "dropped")
  })
})
