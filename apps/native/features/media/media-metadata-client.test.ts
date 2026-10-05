import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  fetchMetadataFromApi,
  searchMetadataFromApi,
} from "./media-metadata-client"

async function withMockedFetch(
  implementation: typeof fetch,
  callback: () => Promise<void>,
) {
  const originalFetch = globalThis.fetch
  globalThis.fetch = implementation

  try {
    await callback()
  } finally {
    globalThis.fetch = originalFetch
  }
}

describe("native metadata client", () => {
  it("surfaces server JSON errors from /api/metadata", async () => {
    await withMockedFetch(
      (async () =>
        new Response(JSON.stringify({ error: "TMDB unavailable" }), {
          headers: { "Content-Type": "application/json" },
          status: 503,
        })) as typeof fetch,
      async () => {
        await assert.rejects(
          () => fetchMetadataFromApi("https://example.com/api/metadata?title=Alien"),
          /TMDB unavailable/,
        )
      },
    )
  })

  it("translates search transport failures into an actionable Expo API message", async () => {
    await withMockedFetch(
      (async () => {
        throw new TypeError("Network request failed")
      }) as typeof fetch,
      async () => {
        await assert.rejects(
          () => searchMetadataFromApi("https://example.com/api/metadata/search?q=Alien"),
          /Unable to reach the Expo metadata search route/,
        )
      },
    )
  })

  it("returns metadata unchanged on success", async () => {
    const metadata = {
      title: "Alien",
      type: "Movie",
      year: "1979",
    }

    await withMockedFetch(
      (async () =>
        new Response(JSON.stringify({ metadata }), {
          headers: { "Content-Type": "application/json" },
          status: 200,
        })) as typeof fetch,
      async () => {
        const result = await fetchMetadataFromApi("https://example.com/api/metadata?title=Alien")
        assert.deepEqual(result, metadata)
      },
    )
  })

  it("returns metadata search results with provider source metadata", async () => {
    await withMockedFetch(
      (async () =>
        new Response(
          JSON.stringify({
            results: [
              {
                id: "tmdb_movie_1",
                media_type: "movie",
                poster_url: null,
                source: "tmdb",
                title: "Alien",
                year: "1979",
              },
            ],
          }),
          {
            headers: { "Content-Type": "application/json" },
            status: 200,
          },
        )) as typeof fetch,
      async () => {
        const results = await searchMetadataFromApi("https://example.com/api/metadata/search?q=Alien")

        assert.deepEqual(results, [
          {
            id: "tmdb_movie_1",
            media_type: "movie",
            poster_url: null,
            source: "tmdb",
            title: "Alien",
            year: "1979",
          },
        ])
      },
    )
  })
})
