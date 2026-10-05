function safeParseUrl(rawUrl: string | null | undefined) {
  if (!rawUrl) {
    return null
  }

  try {
    return new URL(rawUrl)
  } catch {
    return null
  }
}

export const DEFAULT_PRODUCTION_API_BASE_URL = "https://analytics-native.expo.app"

export function normalizeBaseUrl(rawBaseUrl: string) {
  return rawBaseUrl.endsWith("/") ? rawBaseUrl.slice(0, -1) : rawBaseUrl
}

function isPrivateIpv4Address(hostname: string) {
  if (/^127\./.test(hostname)) return true
  if (/^10\./.test(hostname)) return true
  if (/^192\.168\./.test(hostname)) return true

  const parts = hostname.split(".").map((part) => Number(part))
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) {
    return false
  }

  return parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31
}

export function isLocalDevelopmentHostname(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "::1" ||
    hostname.endsWith(".local") ||
    isPrivateIpv4Address(hostname)
  )
}

export function resolveApiBaseUrl({
  browserBaseUrl,
  configuredApiBaseUrl,
}: {
  browserBaseUrl: string | null
  configuredApiBaseUrl: string | null
  expoDevServerBaseUrl: string | null
  isDev: boolean
}) {
  // In a browser the Expo API routes are always co-hosted with the page, so
  // relative URLs (empty base) are both correct and immune to IP drift between
  // dev server restarts or network changes.
  if (browserBaseUrl) {
    return ""
  }

  if (!configuredApiBaseUrl) {
    return DEFAULT_PRODUCTION_API_BASE_URL
  }

  if (configuredApiBaseUrl.includes("supabase.co")) {
    return DEFAULT_PRODUCTION_API_BASE_URL
  }

  return normalizeBaseUrl(configuredApiBaseUrl)
}
