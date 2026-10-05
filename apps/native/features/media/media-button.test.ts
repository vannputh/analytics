import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { getMediaButtonAppearance } from "@/features/media/media-button-appearance"

describe("media button appearance", () => {
  it("maps selected chip buttons to the emphasized monochrome state", () => {
    const appearance = getMediaButtonAppearance({
      selected: true,
      tone: "light",
      variant: "chip",
    })

    assert.equal(appearance.backgroundColor, "#111827")
    assert.equal(appearance.textColor, "#FFFFFF")
    assert.equal(appearance.useGlass, false)
  })

  it("maps disabled glass buttons without changing their variant identity", () => {
    const appearance = getMediaButtonAppearance({
      disabled: true,
      tone: "dark",
      variant: "glass",
    })

    assert.equal(appearance.useGlass, true)
    assert.equal(appearance.textColor, "#FFFFFF")
    assert.equal(appearance.pressedOpacity, 0.45)
  })

  it("keeps destructive buttons visually distinct from secondary buttons", () => {
    const destructive = getMediaButtonAppearance({
      tone: "dark",
      variant: "destructive",
    })
    const secondary = getMediaButtonAppearance({
      tone: "dark",
      variant: "secondary",
    })

    assert.notEqual(destructive.textColor, secondary.textColor)
    assert.notEqual(destructive.borderColor, secondary.borderColor)
  })
})
