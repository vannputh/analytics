import { describe, expect, it } from "vitest"
import { normalizeLanguage } from "./language-utils"

describe("normalizeLanguage", () => {
  it("maps ISO codes to full English names", () => {
    expect(normalizeLanguage("en")).toEqual(["English"])
    expect(normalizeLanguage("ja")).toEqual(["Japanese"])
  })

  // The DB stores language inconsistently (codes, names, native scripts). Normalizing
  // to a single canonical form is what lets filter options and filtering line up.
  it("deduplicates equivalent forms to one canonical name", () => {
    expect(normalizeLanguage(["en", "English", "eng"])).toEqual(["English"])
  })

  it("splits comma-separated strings and sorts the result", () => {
    expect(normalizeLanguage("ja, en")).toEqual(["English", "Japanese"])
  })

  it("parses a JSON-array string (how the column is sometimes persisted)", () => {
    expect(normalizeLanguage('["English","Korean"]')).toEqual(["English", "Korean"])
  })

  it("returns an empty array for empty / null / undefined input", () => {
    expect(normalizeLanguage(null)).toEqual([])
    expect(normalizeLanguage(undefined)).toEqual([])
    expect(normalizeLanguage("")).toEqual([])
  })
})
