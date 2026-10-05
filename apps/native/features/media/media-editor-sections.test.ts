import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  createInitialMediaEditorSectionState,
  toggleMediaEditorSection,
} from "@/features/media/media-editor-sections"

describe("media editor section state", () => {
  it("starts with all secondary sections collapsed", () => {
    assert.deepEqual(createInitialMediaEditorSectionState(), {
      metadata: false,
      progress: false,
      ratings: false,
    })
  })

  it("toggles a single section without mutating the others", () => {
    const initial = createInitialMediaEditorSectionState()
    const next = toggleMediaEditorSection(initial, "progress")

    assert.deepEqual(next, {
      metadata: false,
      progress: true,
      ratings: false,
    })
    assert.deepEqual(initial, {
      metadata: false,
      progress: false,
      ratings: false,
    })
  })
})
