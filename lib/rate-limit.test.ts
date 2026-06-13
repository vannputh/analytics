import { describe, expect, it } from "vitest"
import { rateLimit } from "./rate-limit"

describe("rateLimit", () => {
  // Each test uses a unique key so the shared in-memory store doesn't leak between tests.
  it("allows requests up to the limit within the window", () => {
    const key = "user-a"
    expect(rateLimit(key, 3, 60_000, 0).allowed).toBe(true)
    expect(rateLimit(key, 3, 60_000, 1).allowed).toBe(true)
    expect(rateLimit(key, 3, 60_000, 2).allowed).toBe(true)
  })

  it("denies the request that exceeds the limit and reports retryAfter", () => {
    const key = "user-b"
    rateLimit(key, 2, 60_000, 0)
    rateLimit(key, 2, 60_000, 0)
    const blocked = rateLimit(key, 2, 60_000, 0)
    expect(blocked.allowed).toBe(false)
    expect(blocked.retryAfterSec).toBe(60)
  })

  it("resets after the window elapses", () => {
    const key = "user-c"
    rateLimit(key, 1, 10_000, 0)
    expect(rateLimit(key, 1, 10_000, 5_000).allowed).toBe(false)
    // Window has fully elapsed -> fresh allowance.
    expect(rateLimit(key, 1, 10_000, 10_000).allowed).toBe(true)
  })

  it("tracks limits per key independently", () => {
    rateLimit("user-d", 1, 60_000, 0)
    // A different key still has its full allowance.
    expect(rateLimit("user-e", 1, 60_000, 0).allowed).toBe(true)
  })
})
