import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { defaultFilterState } from "@analytics/domain"

import { summarizeMediaFilterGroupSelection } from "@/features/media/media-filter-groups"
import { countActiveMediaFilters } from "@/features/media/media-filter-utils"

describe("media filter helpers", () => {
  it("treats the default state as cleared", () => {
    assert.equal(countActiveMediaFilters(defaultFilterState), 0)
  })

  it("counts active date and multi-select filters", () => {
    assert.equal(
      countActiveMediaFilters({
        ...defaultFilterState,
        dateFrom: "2026-01-01",
        genres: ["Drama", "Mystery"],
        statuses: ["watched"],
      }),
      4,
    )
  })

  it("summarizes selected filter values compactly", () => {
    assert.equal(
      summarizeMediaFilterGroupSelection(
        {
          ...defaultFilterState,
          platforms: ["Criterion Channel", "Netflix", "MUBI"],
        },
        "platforms",
      ),
      "3 selected",
    )

    assert.equal(
      summarizeMediaFilterGroupSelection(
        {
          ...defaultFilterState,
          genres: ["Drama", "Mystery"],
        },
        "genres",
      ),
      "Drama, Mystery",
    )
  })
})
