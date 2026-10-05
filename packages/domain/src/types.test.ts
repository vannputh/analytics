import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { formatRelativeTime } from "./types"

describe("type helpers", () => {
  it("falls back for null and invalid values", () => {
    assert.equal(formatRelativeTime(null), "N/A")
    assert.equal(formatRelativeTime("not-a-date"), "N/A")
  })

  it("formats recent minutes", () => {
    const now = new Date("2026-03-10T10:45:00.000Z")

    assert.equal(formatRelativeTime("2026-03-10T10:15:00.000Z", now), "about 30 minutes ago")
  })

  it("formats recent hours", () => {
    const now = new Date("2026-03-10T23:00:00.000Z")

    assert.equal(formatRelativeTime("2026-03-10T00:00:00.000Z", now), "about 23 hours ago")
  })

  it("formats multi-day values in days", () => {
    const now = new Date("2026-03-10T12:00:00.000Z")

    assert.equal(formatRelativeTime("2026-03-07T12:00:00.000Z", now), "about 3 days ago")
  })
})
