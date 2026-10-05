import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { createEmptyMediaDraft } from "@analytics/domain"

import {
  createSelectedMetadataFeedback,
  deriveMediaEditorFooterLayout,
  deriveMediaEditorSaveFeedback,
} from "@/features/media/media-editor-ux"

describe("media editor ux helpers", () => {
  it("creates a visible success state for selected metadata", () => {
    const feedback = createSelectedMetadataFeedback("tmdb")

    assert.equal(feedback.tone, "success")
    assert.match(feedback.message, /Filled from TMDB/)
  })

  it("derives save feedback from the current draft state", () => {
    const empty = deriveMediaEditorSaveFeedback({
      draft: createEmptyMediaDraft("2026-01-01"),
      saving: false,
      selectedSource: null,
    })
    const ready = deriveMediaEditorSaveFeedback({
      draft: { ...createEmptyMediaDraft("2026-01-01"), title: "Alien" },
      saving: false,
      selectedSource: "omdb",
    })
    const saving = deriveMediaEditorSaveFeedback({
      draft: { ...createEmptyMediaDraft("2026-01-01"), title: "Alien" },
      saving: true,
      selectedSource: "tmdb",
    })

    assert.equal(empty.tone, "warning")
    assert.equal(empty.message, "Title required")
    assert.equal(ready.tone, "success")
    assert.match(ready.message, /Filled from OMDb/)
    assert.equal(saving.tone, "neutral")
    assert.equal(saving.message, "Saving your entry…")
  })

  it("uses a compact footer layout when the keyboard is visible", () => {
    assert.equal(deriveMediaEditorFooterLayout(false), "regular")
    assert.equal(deriveMediaEditorFooterLayout(true), "compact")
  })
})
