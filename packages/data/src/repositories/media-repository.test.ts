import assert from "node:assert/strict"
import { describe, it } from "node:test"

import type {
  AnalyticsSupabaseClient,
} from "../supabase/client"
import {
  createMediaRepository,
  createStorageRepository,
  createUserPreferenceRepository,
  buildMediaPosterStoragePath,
} from "../index"

type Row = Record<string, any>

function createFakeClient(seed?: Partial<Record<string, Row[]>>) {
  const tables: Record<string, Row[]> = {
    media_entries: seed?.media_entries?.map((row) => ({ ...row })) ?? [],
    media_status_history: seed?.media_status_history?.map((row) => ({ ...row })) ?? [],
    user_preferences: seed?.user_preferences?.map((row) => ({ ...row })) ?? [],
  }

  const storageUploads: {
    bucket: string
    path: string
    file: ArrayBuffer
    options: { contentType: string; upsert: boolean }
  }[] = []

  function createBuilder(table: string) {
    const state: {
      action: "select" | "update" | "insert" | "delete" | "upsert" | null
      filters: Array<{ type: "eq" | "in" | "neq"; column: string; value: unknown }>
      insertValue?: unknown
      updateValue?: Row
      limit?: number
      order?: { column: string; ascending: boolean }
      selectColumns?: string
      maybeSingle?: boolean
      single?: boolean
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
        if (filter.type === "neq") {
          rows = rows.filter((row) => row[filter.column] !== filter.value)
        }
        if (filter.type === "in") {
          rows = rows.filter((row) => (filter.value as unknown[]).includes(row[filter.column]))
        }
      }

      if (state.order) {
        const order = state.order
        rows = rows
          .slice()
          .sort((left, right) =>
            order.ascending
              ? String(left[order.column] ?? "").localeCompare(String(right[order.column] ?? ""))
              : String(right[order.column] ?? "").localeCompare(String(left[order.column] ?? "")),
          )
      } else {
        rows = rows.slice()
      }

      if (typeof state.limit === "number") {
        rows = rows.slice(0, state.limit)
      }

      return rows
    }

    function execute() {
      if (state.action === "select") {
        const rows = getRows()
        const data = rows.map((row) => ({ ...row }))

        if (state.single) {
          return Promise.resolve({ data: data[0] ?? null, error: null })
        }

        if (state.maybeSingle) {
          return Promise.resolve({ data: data[0] ?? null, error: null })
        }

        return Promise.resolve({ data, error: null })
      }

      if (state.action === "update") {
        const rows = getRows()
        const updatedRows = rows.map((row) => Object.assign(row, state.updateValue))

        if (state.single) {
          return Promise.resolve({ data: updatedRows[0] ?? null, error: null })
        }

        return Promise.resolve({ data: updatedRows.map((row) => ({ ...row })), error: null })
      }

      if (state.action === "insert") {
        const value = Array.isArray(state.insertValue) ? state.insertValue : [state.insertValue]
        const inserted = value.map((item) => ({ ...item }))
        tables[table].push(...inserted)

        if (state.single) {
          return Promise.resolve({ data: inserted[0] ?? null, error: null })
        }

        return Promise.resolve({ data: inserted, error: null })
      }

      if (state.action === "upsert") {
        const payload = state.insertValue as Row
        const existing = tables[table].find(
          (row) =>
            row.user_id === payload.user_id &&
            row.preference_key === payload.preference_key,
        )

        if (existing) {
          Object.assign(existing, payload)
        } else {
          tables[table].push({ ...payload })
        }

        return Promise.resolve({ data: null, error: null })
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
      neq(column: string, value: unknown) {
        state.filters.push({ type: "neq", column, value })
        return builder
      },
      in(column: string, value: unknown[]) {
        state.filters.push({ type: "in", column, value })
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
      range(_from: number, _to: number) {
        return builder
      },
      ilike(_column: string, _value: string) {
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
      upsert(value: Row) {
        state.action = "upsert"
        state.insertValue = value
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

  const client = {
    from(table: string) {
      return createBuilder(table)
    },
    storage: {
      from(bucket: string) {
        return {
          upload(path: string, file: ArrayBuffer, options: { contentType: string; upsert: boolean }) {
            storageUploads.push({ bucket, path, file, options })
            return Promise.resolve({ data: { path }, error: null })
          },
          getPublicUrl(path: string) {
            return { data: { publicUrl: `https://storage.example/${bucket}/${path}` } }
          },
        }
      },
    },
  }

  return {
    client: client as unknown as AnalyticsSupabaseClient,
    storageUploads,
    tables,
  }
}

describe("media repository services", () => {
  it("loads entry details, history, and unique field values", async () => {
    const fake = createFakeClient({
      media_entries: [
        {
          id: "entry-1",
          title: "Arrival",
          status: "watched",
          medium: "Movie",
          type: "Documentary",
          platform: "Netflix",
          language: ["English"],
        },
      ],
      media_status_history: [
        { id: "history-1", media_entry_id: "entry-1", changed_at: "2026-01-02T00:00:00.000Z" },
      ],
    })
    const repository = createMediaRepository(fake.client)

    const entry = await repository.getEntry("entry-1")
    const history = await repository.getStatusHistory("entry-1")
    const options = await repository.getUniqueFieldValues()

    assert.equal(entry?.title, "Arrival")
    assert.equal(history.length, 1)
    assert.deepEqual(options.platforms, ["Netflix"])
    assert.deepEqual(options.languages, ["English"])
  })

  it("restarts dropped entries and batch updates genres without duplicates", async () => {
    const fake = createFakeClient({
      media_entries: [
        {
          id: "entry-1",
          title: "Lost",
          status: "dropped",
          start_date: null,
          genre: ["Mystery"],
        },
        {
          id: "entry-2",
          title: "Dark",
          status: "watching",
          genre: ["Sci-Fi"],
        },
      ],
    })
    const repository = createMediaRepository(fake.client)

    const restarted = await repository.restartEntry("entry-1", "2026-02-01")
    assert.equal(restarted.status, "watching")
    assert.equal(restarted.start_date, "2026-02-01")

    const updated = await repository.batchUpdateEntries(
      [
        fake.tables.media_entries[0] as any,
        fake.tables.media_entries[1] as any,
      ],
      {
        platform: "Max",
        appendGenres: ["Mystery", "Thriller"],
      },
    )

    assert.deepEqual(updated[0].genre, ["Mystery", "Thriller"])
    assert.deepEqual(updated[1].genre, ["Sci-Fi", "Mystery", "Thriller"])
    assert.equal(updated[0].platform, "Max")
    assert.equal(updated[1].platform, "Max")
  })

  it("persists preferences and builds media poster upload paths", async () => {
    const fake = createFakeClient()
    const preferenceRepository = createUserPreferenceRepository(fake.client)
    const storageRepository = createStorageRepository(fake.client)

    await preferenceRepository.setUserPreference("user-1", "media-display", ["poster", "platform"])
    const preference = await preferenceRepository.getUserPreference<string[]>("user-1", "media-display")

    assert.deepEqual(preference, ["poster", "platform"])
    assert.equal(
      buildMediaPosterStoragePath({
        userId: "user-1",
        title: "  My Poster  ",
        fileName: "cover.png",
        contentType: "image/png",
        now: 123,
      }),
      "user-1/my-poster-123.png",
    )

    const result = await storageRepository.uploadMediaPoster({
      userId: "user-1",
      title: "Arrival",
      fileName: "poster.jpg",
      contentType: "image/jpeg",
      file: new Uint8Array([1, 2, 3]).buffer,
      now: 999,
    })

    assert.equal(result.path, "user-1/arrival-999.jpg")
    assert.equal(result.publicUrl, "https://storage.example/images/user-1/arrival-999.jpg")
    assert.equal(fake.storageUploads.length, 1)
  })

  it("uploads food place images into the food-images bucket", async () => {
    const fake = createFakeClient()
    const storageRepository = createStorageRepository(fake.client)

    const result = await storageRepository.uploadFoodPlaceImage({
      entryId: "entry-1",
      fileName: "place.jpg",
      contentType: "image/jpeg",
      file: new Uint8Array([1, 2, 3]).buffer,
      now: 1234,
    })

    assert.equal(result.path, "entry-1/place_1234.jpg")
    assert.equal(result.publicUrl, "https://storage.example/food-images/entry-1/place_1234.jpg")
    assert.equal(fake.storageUploads[0]?.bucket, "food-images")
  })
})
