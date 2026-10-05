import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  createMediaDiaryAreaSwitcherSegments,
  MEDIA_DIARY_AREA_SWITCHER_PRESSED_OVERLAY,
  MEDIA_DIARY_AREA_SWITCHER_SELECTED_BACKGROUND,
  MEDIA_DIARY_AREA_SWITCHER_SELECTED_TEXT,
  MEDIA_DIARY_AREA_SWITCHER_UNSELECTED_BACKGROUND,
  MEDIA_DIARY_AREA_SWITCHER_UNSELECTED_BORDER,
  MEDIA_DIARY_AREA_SWITCHER_UNSELECTED_TEXT,
} from "@/features/media/sections/media-diary-area-switcher-theme"

describe("media diary area switcher theme", () => {
  it("creates one segment per diary area and marks only the active segment as selected", () => {
    const segments = createMediaDiaryAreaSwitcherSegments("watched", () => {})

    assert.deepEqual(
      segments.map((segment) => ({
        icon: segment.icon,
        label: segment.label,
        selected: segment.selected,
      })),
      [
        { icon: "play.circle.fill", label: "watching", selected: false },
        { icon: "checkmark.circle", label: "Watched", selected: true },
        { icon: "tray.full", label: "Queue", selected: false },
        { icon: "pause.circle.fill", label: "Paused", selected: false },
        { icon: "xmark.circle.fill", label: "dropped", selected: false },
      ],
    )
  })

  it("wires segment presses back to the selected media area", () => {
    const selections: string[] = []
    const segments = createMediaDiaryAreaSwitcherSegments("watching", (nextArea) => {
      selections.push(nextArea)
    })

    segments[4]?.onPress()

    assert.deepEqual(selections, ["dropped"])
  })

  it("uses the monochrome switcher treatment", () => {
    assert.equal(MEDIA_DIARY_AREA_SWITCHER_SELECTED_BACKGROUND, "#111111")
    assert.equal(MEDIA_DIARY_AREA_SWITCHER_SELECTED_TEXT, "#FFFFFF")
    assert.equal(MEDIA_DIARY_AREA_SWITCHER_UNSELECTED_BACKGROUND, "rgba(255, 255, 255, 0.9)")
    assert.equal(MEDIA_DIARY_AREA_SWITCHER_UNSELECTED_BORDER, "rgba(17, 17, 17, 0.04)")
    assert.equal(MEDIA_DIARY_AREA_SWITCHER_UNSELECTED_TEXT, "#111111")
    assert.equal(MEDIA_DIARY_AREA_SWITCHER_PRESSED_OVERLAY, "rgba(17, 17, 17, 0.06)")
  })
})
