import assert from "node:assert/strict"
import { describe, it } from "node:test"

import type { AnalyticsSupabaseClient } from "../supabase/client"
import { createFoodRepository } from "../index"

type Row = Record<string, any>

function createFakeClient(seed?: Partial<Record<string, Row[]>>) {
  const tables: Record<string, Row[]> = {
    food_entries: seed?.food_entries?.map((row) => ({ ...row })) ?? [],
    food_entry_images: seed?.food_entry_images?.map((row) => ({ ...row })) ?? [],
  }

  function createBuilder(table: string) {
    const state: {
      action: "delete" | "insert" | "select" | "update" | null
      filters: Array<{ type: "eq" | "gte" | "in" | "lte" | "overlaps"; column: string; value: unknown }>
      limit?: number
      maybeSingle?: boolean
      offset?: number
      orSearch?: string
      order?: { column: string; ascending: boolean }
      selectColumns?: string
      single?: boolean
      updateValue?: Row
      insertValue?: unknown
    } = {
      action: null,
      filters: [],
    }

    function getRows() {
      let rows = tables[table] ?? []

      for (const filter of state.filters) {
        if (filter.type === "eq") {
          rows = rows.filter((row) => row[filter.column] === filter.value)
        }
        if (filter.type === "gte") {
          rows = rows.filter((row) => String(row[filter.column] ?? "") >= String(filter.value ?? ""))
        }
        if (filter.type === "lte") {
          rows = rows.filter((row) => String(row[filter.column] ?? "") <= String(filter.value ?? ""))
        }
        if (filter.type === "in") {
          rows = rows.filter((row) => (filter.value as unknown[]).includes(row[filter.column]))
        }
        if (filter.type === "overlaps") {
          rows = rows.filter((row) =>
            Array.isArray(row[filter.column]) &&
            row[filter.column].some((value: unknown) => (filter.value as unknown[]).includes(value)),
          )
        }
      }

      if (state.orSearch) {
        const needle = state.orSearch.toLowerCase()
        rows = rows.filter((row) =>
          [row.name, row.branch]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(needle)),
        )
      }

      if (state.order) {
        const { column, ascending } = state.order
        rows = rows
          .slice()
          .sort((left, right) =>
            ascending
              ? String(left[column] ?? "").localeCompare(String(right[column] ?? ""))
              : String(right[column] ?? "").localeCompare(String(left[column] ?? "")),
          )
      } else {
        rows = rows.slice()
      }

      if (
        state.selectColumns?.includes("food_entry_images") &&
        table === "food_entries"
      ) {
        rows = rows.map((row) => ({
          ...row,
          food_entry_images: tables.food_entry_images.filter((image) => image.food_entry_id === row.id),
        }))
      }

      if (typeof state.offset === "number" && typeof state.limit === "number") {
        rows = rows.slice(state.offset, state.offset + state.limit)
      } else if (typeof state.limit === "number") {
        rows = rows.slice(0, state.limit)
      }

      return rows
    }

    function execute() {
      if (state.action === "select") {
        const rows = getRows()
        const data = rows.map((row) => ({ ...row }))

        if (state.single || state.maybeSingle) {
          return Promise.resolve({ data: data[0] ?? null, error: null })
        }

        return Promise.resolve({ data, error: null })
      }

      if (state.action === "insert") {
        const values = Array.isArray(state.insertValue) ? state.insertValue : [state.insertValue]
        const inserted = values.map((value) => ({ ...value }))
        tables[table].push(...inserted)
        return Promise.resolve({
          data: state.single ? inserted[0] ?? null : inserted,
          error: null,
        })
      }

      if (state.action === "update") {
        const rows = getRows()
        const updated = rows.map((row) => Object.assign(row, state.updateValue))
        return Promise.resolve({
          data: state.single ? updated[0] ?? null : updated,
          error: null,
        })
      }

      if (state.action === "delete") {
        const rows = getRows()
        tables[table] = tables[table].filter((row) => !rows.includes(row))
        return Promise.resolve({ data: null, error: null })
      }

      return Promise.resolve({ data: null, error: null })
    }

    const builder = {
      select(columns?: string) {
        if (!state.action) {
          state.action = "select"
        }
        state.selectColumns = columns
        return builder
      },
      eq(column: string, value: unknown) {
        state.filters.push({ type: "eq", column, value })
        return builder
      },
      gte(column: string, value: unknown) {
        state.filters.push({ type: "gte", column, value })
        return builder
      },
      lte(column: string, value: unknown) {
        state.filters.push({ type: "lte", column, value })
        return builder
      },
      in(column: string, value: unknown[]) {
        state.filters.push({ type: "in", column, value })
        return builder
      },
      overlaps(column: string, value: unknown[]) {
        state.filters.push({ type: "overlaps", column, value })
        return builder
      },
      order(column: string, options: { ascending: boolean }) {
        state.order = { column, ascending: options.ascending }
        return builder
      },
      limit(value: number) {
        state.limit = value
        return builder
      },
      range(from: number, to: number) {
        state.offset = from
        state.limit = to - from + 1
        return builder
      },
      or(expression: string) {
        const matches = [...expression.matchAll(/"%([^"]+)%"/g)]
        state.orSearch = matches[0]?.[1]?.trim().toLowerCase() ?? ""
        return builder
      },
      insert(value: unknown) {
        state.action = "insert"
        state.insertValue = value
        return builder
      },
      update(value: Row) {
        state.action = "update"
        state.updateValue = value
        return builder
      },
      delete() {
        state.action = "delete"
        return builder
      },
      single() {
        state.single = true
        return execute()
      },
      maybeSingle() {
        state.maybeSingle = true
        return execute()
      },
      then(resolve: (value: any) => any, reject?: (reason?: any) => any) {
        return execute().then(resolve, reject)
      },
    }

    return builder
  }

  return {
    client: {
      from(table: string) {
        return createBuilder(table)
      },
    } as unknown as AnalyticsSupabaseClient,
    tables,
  }
}

describe("food repository services", () => {
  it("loads month entries grouped by day and resolves detail images", async () => {
    const fake = createFakeClient({
      food_entries: [
        {
          id: "entry-1",
          name: "Rice House",
          branch: "BKK1",
          visit_date: "2026-03-11",
          city: "Phnom Penh",
          created_at: "2026-03-11T00:00:00.000Z",
        },
        {
          id: "entry-2",
          name: "Cafe Blue",
          visit_date: "2026-03-09",
          city: "Siem Reap",
          created_at: "2026-03-09T00:00:00.000Z",
        },
      ],
      food_entry_images: [
        {
          id: "image-1",
          food_entry_id: "entry-1",
          image_url: "https://example.com/primary.jpg",
          is_primary: true,
          created_at: "2026-03-11T00:00:00.000Z",
        },
        {
          id: "image-2",
          food_entry_id: "entry-1",
          image_url: "https://example.com/secondary.jpg",
          is_primary: false,
          created_at: "2026-03-11T01:00:00.000Z",
        },
      ],
    })
    const repository = createFoodRepository(fake.client)

    const monthEntries = await repository.getEntriesForMonth(2026, 3)
    const detail = await repository.getEntryById("entry-1", { includeImages: true })

    assert.equal(monthEntries["2026-03-11"]?.[0]?.primary_image_url, "https://example.com/primary.jpg")
    assert.equal(detail?.images.length, 2)
    assert.equal(detail?.images[0]?.is_primary, true)
  })

  it("creates, updates, deletes entries, and derives field options", async () => {
    const fake = createFakeClient({
      food_entries: [
        {
          id: "entry-1",
          name: "Rice House",
          visit_date: "2026-03-11",
          category: "Restaurant",
          city: "Phnom Penh",
          cuisine_type: ["Cambodian"],
          items_ordered: [{ name: "Amok", price: 12, image_url: null, category: "Main", categories: ["Curry"] }],
        },
      ],
    })
    const repository = createFoodRepository(fake.client)

    const created = await repository.createEntry({
      id: "entry-2",
      name: "Cafe Blue",
      visit_date: "2026-03-12",
      branch: null,
      category: "Café",
      address: null,
      google_maps_url: null,
      latitude: null,
      longitude: null,
      neighborhood: null,
      city: "Siem Reap",
      country: "Cambodia",
      instagram_handle: null,
      website_url: null,
      primary_image_url: null,
      images: [],
      items_ordered: [],
      favorite_item: null,
      overall_rating: null,
      food_rating: null,
      ambiance_rating: null,
      service_rating: null,
      value_rating: null,
      total_price: null,
      currency: "USD",
      price_level: null,
      cuisine_type: ["French"],
      dining_type: null,
      tags: null,
      would_return: null,
      notes: null,
    })
    const updated = await repository.updateEntry("entry-2", { city: "Kampot" })
    const options = await repository.getFieldOptions()
    const suggestions = await repository.getLocalPlaceSuggestions("rice")

    await repository.deleteEntry("entry-2")

    assert.equal(created.name, "Cafe Blue")
    assert.equal(updated.city, "Kampot")
    assert.deepEqual(options.categories, ["Café", "Restaurant"])
    assert.deepEqual(options.cities, ["Kampot", "Phnom Penh"])
    assert.deepEqual(options.cuisineTypes, ["Cambodian", "French"])
    assert.deepEqual(options.itemCategories, ["Curry"])
    assert.equal(suggestions[0]?.name, "Rice House")
    assert.equal(fake.tables.food_entries.some((entry) => entry.id === "entry-2"), false)
  })

  it("unsets other primary flags when inserting a primary food image", async () => {
    const fake = createFakeClient({
      food_entries: [
        {
          id: "entry-1",
          name: "Rice House",
          visit_date: "2026-03-11",
        },
      ],
      food_entry_images: [
        {
          id: "image-1",
          food_entry_id: "entry-1",
          image_url: "https://example.com/old.jpg",
          storage_path: "entry-1/place_1.jpg",
          is_primary: true,
          caption: null,
        },
      ],
    })
    const repository = createFoodRepository(fake.client)

    const inserted = await repository.insertEntryImage({
      id: "image-2",
      food_entry_id: "entry-1",
      image_url: "https://example.com/new.jpg",
      storage_path: "entry-1/place_2.jpg",
      is_primary: true,
      caption: null,
    })

    const previous = fake.tables.food_entry_images.find((image) => image.id === "image-1")

    assert.equal(inserted.is_primary, true)
    assert.equal(inserted.image_url, "https://example.com/new.jpg")
    assert.equal(previous?.is_primary, false)
  })
})
