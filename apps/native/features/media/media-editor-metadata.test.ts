import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { createEmptyMediaDraft } from "@analytics/domain"

import { applySelectedMetadataToDraft } from "@/features/media/media-editor-metadata"

describe("media editor metadata selection", () => {
  it("applies selected metadata conflicts directly for create flow", () => {
    const draft = {
      ...createEmptyMediaDraft("2026-01-01"),
      title: "alie",
    }

    const nextDraft = applySelectedMetadataToDraft(draft, {
      genre: ["Sci-Fi", "Horror"],
      imdb_id: "tt0078748",
      poster_url: "https://example.com/alien.jpg",
      title: "Alien",
      type: "Movie",
      year: "1979",
    })

    assert.equal(nextDraft.title, "Alien")
    assert.equal(nextDraft.imdb_id, "tt0078748")
    assert.equal(nextDraft.poster_url, "https://example.com/alien.jpg")
    assert.deepEqual(nextDraft.genre, ["Sci-Fi", "Horror"])
    assert.equal(nextDraft.medium, "Movie")
  })

  it("switches the default create-flow medium to TV Show when selected metadata is a TV result", () => {
    const draft = {
      ...createEmptyMediaDraft("2026-01-01"),
      title: "sever",
    }

    const nextDraft = applySelectedMetadataToDraft(draft, {
      episodes: 9,
      title: "Severance",
      type: "TV Show",
      year: "2022",
    })

    assert.equal(nextDraft.title, "Severance")
    assert.equal(nextDraft.medium, "TV Show")
    assert.equal(nextDraft.episodes, 9)
  })
})
