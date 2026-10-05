import { getApiBaseUrl as getConfiguredApiBaseUrl } from "./config"

export function getApiBaseUrl() {
  const baseUrl = getConfiguredApiBaseUrl()

  // Empty string is a valid base — it means "use relative URLs" (browser context).
  if (baseUrl === null) {
    throw new Error(
      "Missing EXPO_PUBLIC_API_BASE_URL (or EXPO_PUBLIC_APP_URL) for Expo API requests.",
    )
  }

  return baseUrl
}

export function buildApiUrl(path: string) {
  const baseUrl = getApiBaseUrl()
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  // Empty base means browser same-origin: produce a relative URL.
  return baseUrl === "" ? normalizedPath : `${baseUrl}${normalizedPath}`
}
