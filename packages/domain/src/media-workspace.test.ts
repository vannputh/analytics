import assert from "node:assert/strict"
import { describe, it } from "node:test"

import type { MediaEntry } from "./database.types"
import {
  addEpisodeHistoryRecord,
  applyMediaDraftRules,
  buildInitialEpisodeHistory,
  buildMediaEntryPayload,
  buildRestartEntryPatch,
  deleteEpisodeHistoryRecord,
  extractMediaFieldOptions,
  getMetadataOverrideFields,
  mergeMetadataIntoDraft,
  parseEpisodeHistory,
  updateEpisodeHistoryRecord,
} from "./media-workspace"

function createMediaEntry(
  id: string,
  overrides: Partial<MediaEntry> = {},
): MediaEntry {
  return {
    id,
    title: `Entry ${id}`,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    status: "watching",
    medium: "Movie",
    type: "Movie",
    ...overrides,
  } as MediaEntry
}

describe("media-workspace helpers", () => {
  it("normalizes draft rules and build payloads", () => {
    const draft = buildMediaEntryPayload({
      title: "  Interstellar  ",
      medium: "Movie",
      finish_date: "2026-01-04",
      start_date: "2026-01-01",
      episodes: null,
      episodes_watched: 0,
      language: [" english ", "khmer"],
      genre: ["Sci-Fi", "Drama"],
    })

    assert.equal(draft.title, "Interstellar")
    assert.equal(draft.status, "watched")
    assert.equal(draft.episodes, 1)
    assert.equal(draft.episodes_watched, 1)
    assert.equal(draft.time_taken, "4 days")
    assert.deepEqual(draft.language, ["English", "Khmer"])
    assert.deepEqual(draft.genre, ["Sci-Fi", "Drama"])
  })

  it("builds initial episode history for watching and finished entries", () => {
    assert.deepEqual(
      buildInitialEpisodeHistory({
        title: "Watching show",
        status: "watching",
        episodes: 8,
        start_date: "2026-01-02",
      }),
      {
        episode_history: [{ episode: 1, watched_at: "2026-01-02" }],
        episodes_watched: 1,
        last_watched_at: "2026-01-02",
      },
    )

    assert.deepEqual(
      buildInitialEpisodeHistory({
        title: "Finished show",
        status: "watched",
        episodes: 3,
        finish_date: "2026-01-10",
      }),
      {
        episode_history: [
          { episode: 1, watched_at: "2026-01-10" },
          { episode: 2, watched_at: "2026-01-10" },
          { episode: 3, watched_at: "2026-01-10" },
        ],
        episodes_watched: 3,
        last_watched_at: "2026-01-10",
      },
    )
  })

  it("merges metadata and reports override fields only for populated conflicts", () => {
    const current = applyMediaDraftRules({
      title: "Existing title",
      medium: "TV Show",
      type: "Scripted Live Action",
      episodes: 10,
      language: ["English"],
      genre: ["Drama"],
      imdb_id: "tt1234567",
    })

    const overrideFields = getMetadataOverrideFields(current, {
      title: "New title",
      episodes: 12,
      language: ["Japanese"],
      genre: ["Mystery"],
      imdb_id: "tt7654321",
      poster_url: "https://example.com/poster.jpg",
    })

    assert.deepEqual(overrideFields.sort(), ["episodes", "genre", "imdb_id", "language", "title"])

    const merged = mergeMetadataIntoDraft(
      current,
      {
        title: "New title",
        episodes: 12,
        language: ["Japanese"],
        genre: ["Mystery"],
        imdb_id: "tt7654321",
        poster_url: "https://example.com/poster.jpg",
      },
      ["title", "genre"],
    )

    assert.equal(merged.title, "New title")
    assert.deepEqual(merged.genre, ["Mystery"])
    assert.equal(merged.episodes, 10)
    assert.deepEqual(merged.language, ["English"])
    assert.equal(merged.poster_url, "https://example.com/poster.jpg")
  })

  it("updates and deletes episode history while preserving progress rules", () => {
    const parsed = parseEpisodeHistory([
      { episode: 1, watched_at: "2026-01-01T00:00:00.000Z" },
      { episode: 2, watched_at: "2026-01-02T00:00:00.000Z" },
    ])

    assert.deepEqual(parsed.map((record) => record.episode), [2, 1])

    const added = addEpisodeHistoryRecord(parsed, 3, "2026-01-03T00:00:00.000Z")
    assert.equal(added.episodes_watched, 3)
    assert.equal(added.last_watched_at, "2026-01-03T00:00:00.000Z")

    const addedHistory = added.episode_history as unknown as { episode: number; watched_at: string }[]
    const edited = updateEpisodeHistoryRecord(
      addedHistory,
      1,
      "2026-01-04T00:00:00.000Z",
    )
    const editedHistory = edited.episode_history as unknown as { episode: number; watched_at: string }[]
    assert.equal(editedHistory[1]?.watched_at, "2026-01-04T00:00:00.000Z")

    const removed = deleteEpisodeHistoryRecord(editedHistory, 0)
    assert.equal(removed.episodes_watched, 2)
    assert.equal(removed.last_watched_at, "2026-01-04T00:00:00.000Z")
  })

  it("builds restart patches and extracts unique field options", () => {
    assert.deepEqual(
      buildRestartEntryPatch({ status: "dropped", start_date: null }, "2026-02-01"),
      {
        status: "watching",
        finish_date: null,
        start_date: "2026-02-01",
      },
    )
    assert.equal(buildRestartEntryPatch({ status: "watched", start_date: null }), null)

    const options = extractMediaFieldOptions([
      createMediaEntry("1", {
        type: "Animation",
        status: "watching",
        medium: "TV Show",
        platform: "Netflix",
        language: ["Japanese"],
      }),
      createMediaEntry("2", {
        type: "Documentary",
        status: "watched",
        medium: "Movie",
        platform: "Mubi",
        language: ["English"],
      }),
    ])

    assert.deepEqual(options.types, ["Animation", "Documentary"])
    assert.deepEqual(options.statuses, ["watched", "watching"])
    assert.equal(options.mediums.includes("Movie"), true)
    assert.equal(options.mediums.includes("TV Show"), true)
    assert.deepEqual(options.platforms, ["Mubi", "Netflix"])
    assert.deepEqual(options.languages, ["English", "Japanese"])
  })
})
