import Constants from "expo-constants"
import * as Linking from "expo-linking"

import { normalizeBaseUrl, resolveApiBaseUrl } from "./api-base-url"

function getExtraString(key: "expoPublicSupabaseUrl" | "expoPublicSupabaseAnonKey" | "expoPublicApiUrl") {
  const value = Constants.expoConfig?.extra?.[key]
  return typeof value === "string" && value.length > 0 ? value : null
}

function getBrowserBaseUrl() {
  if (typeof window === "undefined" || !window.location?.origin) {
    return null
  }

  const { origin, protocol } = window.location
  if (protocol !== "http:" && protocol !== "https:") {
    return null
  }

  return normalizeBaseUrl(origin)
}

function isExpoDevEnvironment() {
  const devFlag =
    typeof globalThis !== "undefined" && "__DEV__" in globalThis
      ? (globalThis as typeof globalThis & { __DEV__?: boolean }).__DEV__
      : undefined

  return Boolean(devFlag)
}

function getConfiguredPublicSupabaseUrl() {
  return (
    process.env.EXPO_PUBLIC_SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    getExtraString("expoPublicSupabaseUrl") ??
    null
  )
}

function getConfiguredPublicSupabaseAnonKey() {
  return (
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    getExtraString("expoPublicSupabaseAnonKey") ??
    null
  )
}

function getConfiguredApiBaseUrl() {
  return (
    process.env.EXPO_PUBLIC_API_URL ??
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    process.env.EXPO_PUBLIC_APP_URL ??
    process.env.EXPO_PUBLIC_EAS_HOSTING_URL ??
    getExtraString("expoPublicApiUrl") ??
    null
  )
}

function getExpoDevServerBaseUrl() {
  try {
    const url = Linking.createURL("/")
    const parsedUrl = new URL(url)

    if (parsedUrl.protocol === "exp:" || parsedUrl.protocol === "exps:") {
      const protocol = parsedUrl.protocol === "exps:" ? "https:" : "http:"
      return `${protocol}//${parsedUrl.host}`
    }

    if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
      return parsedUrl.origin
    }
  } catch {
    return null
  }

  return null
}

export function getPublicSupabaseConfig() {
  const publicSupabaseUrl = getConfiguredPublicSupabaseUrl()
  const publicSupabaseAnonKey = getConfiguredPublicSupabaseAnonKey()

  if (!publicSupabaseUrl || !publicSupabaseAnonKey) {
    return null
  }

  return {
    url: publicSupabaseUrl,
    anonKey: publicSupabaseAnonKey,
  }
}

export function hasPublicSupabaseConfig() {
  return getPublicSupabaseConfig() !== null
}

export function getPublicSupabaseConfigError() {
  if (hasPublicSupabaseConfig()) {
    return null
  }

  return "Missing EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY for the Expo app."
}

export function getApiBaseUrl() {
  return resolveApiBaseUrl({
    browserBaseUrl: getBrowserBaseUrl(),
    configuredApiBaseUrl: getConfiguredApiBaseUrl(),
    expoDevServerBaseUrl: getExpoDevServerBaseUrl(),
    isDev: isExpoDevEnvironment(),
  })
}

export function hasApiBaseUrl() {
  return getApiBaseUrl() !== null
}

export function getApiBaseUrlError() {
  if (hasApiBaseUrl()) {
    return null
  }

  return "Missing EXPO_PUBLIC_API_URL, EXPO_PUBLIC_API_BASE_URL, or EXPO_PUBLIC_APP_URL for Expo API requests."
}

export function getNativeConfigurationError() {
  const errors = [getPublicSupabaseConfigError(), getApiBaseUrlError()].filter(Boolean)

  if (errors.length === 0) {
    return null
  }

  return errors.join(" ")
}
