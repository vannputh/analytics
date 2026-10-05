const GOOGLE_MAPS_SHORT_LINK_HOSTS = new Set(["goo.gl", "maps.app.goo.gl"])

/**
 * Google Maps short links that this server is allowed to expand.
 * Host matching is exact so substrings like `notgoo.gl` or `evil.com/goo.gl`
 * cannot turn the expander into an open redirect fetcher.
 */
export function isGoogleMapsShortLinkUrl(value: string): boolean {
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    return false
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return false
  }

  return GOOGLE_MAPS_SHORT_LINK_HOSTS.has(parsed.hostname.toLowerCase())
}

function resolveHttpUrl(location: string, base: string): string | null {
  try {
    const next = new URL(location, base)
    if (next.protocol !== "http:" && next.protocol !== "https:") {
      return null
    }
    return next.href
  } catch {
    return null
  }
}

/**
 * Follow only allowlisted Google short-link hosts. The redirect target is
 * returned for local parsing and is fetched again only when it is itself
 * a short link.
 */
export async function expandGoogleMapsShortUrl(
  url: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  let fullUrl = url

  for (let redirectCount = 0; redirectCount < 5 && isGoogleMapsShortLinkUrl(fullUrl); redirectCount += 1) {
    let response: Response
    try {
      response = await fetchImpl(fullUrl, { method: "HEAD", redirect: "manual" })
    } catch {
      break
    }

    const location = response.headers.get("location")
    if (!location) break

    const nextUrl = resolveHttpUrl(location, fullUrl)
    if (!nextUrl) break

    fullUrl = nextUrl
  }

  return fullUrl
}
