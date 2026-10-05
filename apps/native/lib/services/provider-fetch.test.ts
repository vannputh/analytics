import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { fetchOMDBByTitle } from "./omdb"
import {
  fetchProviderJson,
  isProviderFetchError,
} from "./provider-fetch"
import { fetchTMDBMovie } from "./tmdb"

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

describe("provider fetch helpers", () => {
  it("throws a TMDB provider error for upstream HTTP failures", async () => {
    await withMockedFetch(
      (async () =>
        new Response(JSON.stringify({ status_message: "Invalid API key" }), {
          headers: { "Content-Type": "application/json" },
          status: 401,
        })) as typeof fetch,
      async () => {
        await assert.rejects(
          () => fetchTMDBMovie(12, "bad-key"),
          (error: unknown) => {
            assert.equal(isProviderFetchError(error), true)
            assert.equal(error instanceof Error ? error.message : "", "Invalid API key")
            assert.equal(isProviderFetchError(error) ? error.provider : "", "tmdb")
            assert.equal(isProviderFetchError(error) ? error.status : null, 401)
            return true
          },
        )
      },
    )
  })

  it("throws an OMDb provider error for upstream HTTP failures", async () => {
    await withMockedFetch(
      (async () =>
        new Response(JSON.stringify({ Error: "Service unavailable" }), {
          headers: { "Content-Type": "application/json" },
          status: 503,
        })) as typeof fetch,
      async () => {
        await assert.rejects(
          () => fetchOMDBByTitle("Severance", "bad-key"),
          (error: unknown) => {
            assert.equal(isProviderFetchError(error), true)
            assert.equal(error instanceof Error ? error.message : "", "Service unavailable")
            assert.equal(isProviderFetchError(error) ? error.provider : "", "omdb")
            assert.equal(isProviderFetchError(error) ? error.status : null, 503)
            return true
          },
        )
      },
    )
  })

  it("classifies transport failures before a response exists", async () => {
    await withMockedFetch(
      (async () => {
        throw new TypeError("fetch failed")
      }) as typeof fetch,
      async () => {
        await assert.rejects(
          () =>
            fetchProviderJson("https://example.com", {
              operation: 'searching metadata for "Alien"',
              provider: "tmdb",
            }),
          (error: unknown) => {
            assert.equal(isProviderFetchError(error), true)
            assert.equal(
              error instanceof Error ? error.message : "",
              'Unable to reach TMDB while searching metadata for "Alien".',
            )
            assert.equal(isProviderFetchError(error) ? error.status : null, null)
            return true
          },
        )
      },
    )
  })

  it("throws an unreadable-response error for non-JSON provider payloads", async () => {
    await withMockedFetch(
      (async () =>
        new Response("<html>upstream failure</html>", {
          headers: { "Content-Type": "text/html" },
          status: 200,
        })) as typeof fetch,
      async () => {
        await assert.rejects(
          () =>
            fetchProviderJson("https://example.com", {
              operation: "fetching movie 42",
              provider: "tmdb",
            }),
          (error: unknown) => {
            assert.equal(isProviderFetchError(error), true)
            assert.equal(
              error instanceof Error ? error.message : "",
              "TMDB returned an unreadable response while fetching movie 42.",
            )
            assert.match(
              isProviderFetchError(error) ? error.details ?? "" : "",
              /upstream failure/,
            )
            return true
          },
        )
      },
    )
  })
})
