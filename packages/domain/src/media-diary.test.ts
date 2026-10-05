import assert from "node:assert/strict"
import { describe, it } from "node:test"

import type { MediaEntry } from "./database.types"
import { partitionMediaDiaryEntries } from "./media-diary"

function createMediaEntry(
  id: string,
  overrides: Partial<MediaEntry> = {},
): MediaEntry {
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

describe("partitionMediaDiaryEntries", () => {
  it("groups entries into diary sections and sorts watching and watched entries", () => {
    const entries = [
      createMediaEntry("planned-1", { status: "Planned", title: "Queued first" }),
      createMediaEntry("watching-older", {
        status: "Watching",
        title: "Watching older",
        last_watched_at: "2026-01-02T10:00:00.000Z",
        updated_at: "2026-01-02T11:00:00.000Z",
      }),
      createMediaEntry("finished-older", {
        status: "Finished",
        title: "Finished older",
        finish_date: "2026-01-03",
      }),
      createMediaEntry("hold-1", { status: "On Hold", title: "Paused first" }),
      createMediaEntry("watching-newer", {
        status: "Watching",
        title: "Watching newer",
        last_watched_at: "2026-01-05T10:00:00.000Z",
        updated_at: "2026-01-05T10:30:00.000Z",
      }),
      createMediaEntry("finished-newer", {
        status: "Finished",
        title: "Finished newer",
        finish_date: "2026-01-08",
      }),
      createMediaEntry("planned-2", { status: "Planned", title: "Queued second" }),
      createMediaEntry("dropped-1", { status: "Dropped", title: "Dropped first" }),
      createMediaEntry("watching-alias", {
        status: "Currently Watching",
        title: "Watching alias",
        last_watched_at: "2026-01-04T10:00:00.000Z",
        updated_at: "2026-01-04T12:00:00.000Z",
      }),
    ]

    const result = partitionMediaDiaryEntries(entries)

    assert.deepEqual(
      result.watching.map((entry) => entry.id),
      ["watching-newer", "watching-alias", "watching-older"],
    )
    assert.deepEqual(result.watched.map((entry) => entry.id), ["finished-newer", "finished-older"])
    assert.deepEqual(result.planned.map((entry) => entry.id), ["planned-1", "planned-2"])
    assert.deepEqual(result.holdAndDropped.map((entry) => entry.id), ["hold-1", "dropped-1"])
  })

  it("accepts the native lowercase status vocabulary", () => {
    const result = partitionMediaDiaryEntries([
      createMediaEntry("watching", { status: "watching" }),
      createMediaEntry("watched", { status: "watched", finish_date: "2026-02-01" }),
      createMediaEntry("planned", { status: "planned" }),
      createMediaEntry("paused", { status: "on hold" }),
      createMediaEntry("dropped", { status: "dropped" }),
    ])

    assert.deepEqual(result.watching.map((entry) => entry.id), ["watching"])
    assert.deepEqual(result.watched.map((entry) => entry.id), ["watched"])
    assert.deepEqual(result.planned.map((entry) => entry.id), ["planned"])
    assert.deepEqual(result.holdAndDropped.map((entry) => entry.id), ["paused", "dropped"])
  })
})
