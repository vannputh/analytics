import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { GET } from "../../app/api/metadata+api"

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

describe("Expo metadata route", () => {
  it("returns a configuration error when both metadata keys are missing", async () => {
    await withEnv({ OMDB_API_KEY: undefined, TMDB_API_KEY: undefined }, async () => {
      const response = await GET(new Request("https://example.com/api/metadata?title=Alien"))
      const body = (await response.json()) as { error?: string }

      assert.equal(response.status, 500)
      assert.equal(body.error, "OMDB_API_KEY or TMDB_API_KEY must be configured")
    })
  })

  it("returns a structured TMDB error when TMDB is the only source and fails", async () => {
    await withEnv({ OMDB_API_KEY: undefined, TMDB_API_KEY: "tmdb-key" }, async () => {
      await withMockedFetch(
        (async () =>
          new Response(JSON.stringify({ status_message: "TMDB unavailable" }), {
            headers: { "Content-Type": "application/json" },
            status: 503,
          })) as typeof fetch,
        async () => {
          const response = await GET(
            new Request("https://example.com/api/metadata?title=Alien&source=tmdb&type=movie"),
          )
          const body = (await response.json()) as {
            error?: string
            provider?: string
            status?: number
          }

          assert.equal(response.status, 503)
          assert.equal(body.error, "TMDB unavailable")
          assert.equal(body.provider, "tmdb")
          assert.equal(body.status, 503)
        },
      )
    })
  })

  it("returns a structured OMDb error when OMDb is the only source and fails", async () => {
    await withEnv({ OMDB_API_KEY: "omdb-key", TMDB_API_KEY: undefined }, async () => {
      await withMockedFetch(
        (async () =>
          new Response(JSON.stringify({ Error: "OMDb unavailable" }), {
            headers: { "Content-Type": "application/json" },
            status: 502,
          })) as typeof fetch,
        async () => {
          const response = await GET(
            new Request("https://example.com/api/metadata?title=Alien&source=omdb&type=movie"),
          )
          const body = (await response.json()) as {
            error?: string
            provider?: string
            status?: number
          }

          assert.equal(response.status, 502)
          assert.equal(body.error, "OMDb unavailable")
          assert.equal(body.provider, "omdb")
          assert.equal(body.status, 502)
        },
      )
    })
  })
})
