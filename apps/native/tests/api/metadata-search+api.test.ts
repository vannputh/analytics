import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { GET } from "../../app/api/metadata/search+api"

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

async function withEnv(
  overrides: Partial<Record<"OMDB_API_KEY" | "TMDB_API_KEY", string | undefined>>,
  callback: () => Promise<void>,
) {
  const previous = {
    OMDB_API_KEY: process.env.OMDB_API_KEY,
    TMDB_API_KEY: process.env.TMDB_API_KEY,
  }

  if (overrides.OMDB_API_KEY === undefined) {
    delete process.env.OMDB_API_KEY
  } else {
    process.env.OMDB_API_KEY = overrides.OMDB_API_KEY
  }

  if (overrides.TMDB_API_KEY === undefined) {
    delete process.env.TMDB_API_KEY
  } else {
    process.env.TMDB_API_KEY = overrides.TMDB_API_KEY
  }

  try {
    await callback()
  } finally {
    if (previous.OMDB_API_KEY === undefined) {
      delete process.env.OMDB_API_KEY
    } else {
      process.env.OMDB_API_KEY = previous.OMDB_API_KEY
    }

    if (previous.TMDB_API_KEY === undefined) {
      delete process.env.TMDB_API_KEY
    } else {
      process.env.TMDB_API_KEY = previous.TMDB_API_KEY
    }
  }
}

describe("Expo metadata search route", () => {
  it("returns TMDB results with provider source metadata", async () => {
    await withEnv({ OMDB_API_KEY: undefined, TMDB_API_KEY: "tmdb-key" }, async () => {
      await withMockedFetch(
        (async () =>
          new Response(
            JSON.stringify({
              results: [
                {
                  id: 348,
                  media_type: "movie",
                  poster_path: "/poster.jpg",
                  release_date: "1979-05-25",
                  title: "Alien",
                },
              ],
            }),
            {
              headers: { "Content-Type": "application/json" },
              status: 200,
            },
          )) as typeof fetch,
        async () => {
          const response = await GET(new Request("https://example.com/api/metadata/search?q=alien"))
          const body = (await response.json()) as {
            results?: Array<Record<string, unknown>>
          }

          assert.equal(response.status, 200)
          assert.deepEqual(body.results, [
            {
              id: "tmdb_movie_348",
              media_type: "movie",
              poster_url: "https://image.tmdb.org/t/p/w200/poster.jpg",
              source: "tmdb",
              title: "Alien",
              year: "1979",
            },
          ])
        },
      )
    })
  })

  it("returns a configuration error when both search keys are missing", async () => {
    await withEnv({ OMDB_API_KEY: undefined, TMDB_API_KEY: undefined }, async () => {
      const response = await GET(new Request("https://example.com/api/metadata/search?q=al"))
      const body = (await response.json()) as { error?: string; results?: unknown[] }

      assert.equal(response.status, 500)
      assert.equal(body.error, "TMDB_API_KEY or OMDB_API_KEY must be configured")
      assert.deepEqual(body.results, [])
    })
  })

  it("returns a structured error when both providers fail", async () => {
    await withEnv({ OMDB_API_KEY: "omdb-key", TMDB_API_KEY: "tmdb-key" }, async () => {
      let callCount = 0

      await withMockedFetch(
        (async () => {
          callCount += 1

          if (callCount === 1) {
            throw new TypeError("fetch failed")
          }

          return new Response(JSON.stringify({ Error: "OMDb unavailable" }), {
            headers: { "Content-Type": "application/json" },
            status: 503,
          })
        }) as typeof fetch,
        async () => {
          const response = await GET(new Request("https://example.com/api/metadata/search?q=alien"))
          const body = (await response.json()) as {
            details?: string
            error?: string
            provider?: string
            results?: unknown[]
            status?: number
          }

          assert.equal(response.status, 502)
          assert.equal(body.error, 'Unable to reach TMDB while searching metadata for "alien".')
          assert.equal(body.provider, "tmdb")
          assert.deepEqual(body.results, [])
          assert.equal(body.status, undefined)
          assert.match(body.details ?? "", /fetch failed/)
        },
      )
    })
  })
})
