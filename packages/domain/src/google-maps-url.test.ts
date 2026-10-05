import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { expandGoogleMapsShortUrl, isGoogleMapsShortLinkUrl } from "./google-maps-url"

describe("google maps short links", () => {
  it("allowlists only Google short-link hosts", () => {
    assert.equal(isGoogleMapsShortLinkUrl("https://goo.gl/maps/abc"), true)
    assert.equal(isGoogleMapsShortLinkUrl("https://maps.app.goo.gl/abc"), true)
    assert.equal(isGoogleMapsShortLinkUrl("http://goo.gl/maps/abc"), true)
    assert.equal(isGoogleMapsShortLinkUrl("https://notgoo.gl/maps/abc"), false)
    assert.equal(isGoogleMapsShortLinkUrl("https://evil.com/goo.gl"), false)
    assert.equal(isGoogleMapsShortLinkUrl("https://maps.app.goo.gl.evil.com/abc"), false)
    assert.equal(isGoogleMapsShortLinkUrl("https://www.google.com/maps/place/Cafe"), false)
    assert.equal(isGoogleMapsShortLinkUrl("javascript:alert(1)"), false)
  })

  it("does not fetch urls outside the short-link allowlist", async () => {
    let calls = 0
    const expanded = await expandGoogleMapsShortUrl("https://evil.com/?q=goo.gl", async () => {
      calls += 1
      return new Response(null, { status: 302, headers: { location: "http://169.254.169.254/" } })
    })

    assert.equal(calls, 0)
    assert.equal(expanded, "https://evil.com/?q=goo.gl")
  })

  it("follows an allowlisted hop and stops before fetching the maps destination", async () => {
    const fetched: string[] = []
    const expanded = await expandGoogleMapsShortUrl("https://maps.app.goo.gl/abc", async (input) => {
      fetched.push(String(input))
      return new Response(null, {
        status: 302,
        headers: { location: "https://www.google.com/maps/place/Cafe/@11.55,104.92,17z" },
      })
    })

    assert.deepEqual(fetched, ["https://maps.app.goo.gl/abc"])
    assert.equal(expanded, "https://www.google.com/maps/place/Cafe/@11.55,104.92,17z")
  })
})
