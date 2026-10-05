export type MetadataProvider = "omdb" | "tmdb"

const PROVIDER_LABELS: Record<MetadataProvider, string> = {
  omdb: "OMDb",
  tmdb: "TMDB",
}

function extractErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null
  }

  for (const key of ["error", "Error", "status_message", "message", "details"]) {
    const value = (payload as Record<string, unknown>)[key]
    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }

  return null
}

function summarizeText(text: string | null | undefined) {
  if (!text) {
    return null
  }

  const normalized = text.replace(/\s+/g, " ").trim()
  if (!normalized) {
    return null
  }

  return normalized.length > 240 ? `${normalized.slice(0, 237)}...` : normalized
}

export class ProviderFetchError extends Error {
  readonly details: string | null
  readonly operation: string
  readonly provider: MetadataProvider
  readonly status: number | null

  constructor({
    details,
    message,
    operation,
    provider,
    status,
  }: {
    details?: string | null
    message: string
    operation: string
    provider: MetadataProvider
    status?: number | null
  }) {
    super(message)
    this.name = "ProviderFetchError"
    this.details = details ?? null
    this.operation = operation
    this.provider = provider
    this.status = status ?? null
  }
}

export function isProviderFetchError(error: unknown): error is ProviderFetchError {
  return error instanceof ProviderFetchError
}

export async function fetchProviderJson<T>(
  url: string,
  {
    headers,
    operation,
    provider,
  }: {
    headers?: Record<string, string>
    operation: string
    provider: MetadataProvider
  },
) {
  let response: Response

  try {
    response = await fetch(url, headers ? { headers } : undefined)
  } catch (error) {
    throw new ProviderFetchError({
      details: error instanceof Error ? error.message : null,
      message: `Unable to reach ${PROVIDER_LABELS[provider]} while ${operation}.`,
      operation,
      provider,
    })
  }

  const rawBody = await response.text().catch(() => "")
  let parsedBody: unknown = null

  if (rawBody) {
    try {
      parsedBody = JSON.parse(rawBody) as unknown
    } catch {
      parsedBody = null
    }
  }

  if (!response.ok) {
    throw new ProviderFetchError({
      details:
        extractErrorMessage(parsedBody) ??
        summarizeText(rawBody) ??
        summarizeText(response.statusText),
      message:
        extractErrorMessage(parsedBody) ??
        `${PROVIDER_LABELS[provider]} request failed while ${operation}.`,
      operation,
      provider,
      status: response.status,
    })
  }

  if (!rawBody) {
    return {} as T
  }

  if (parsedBody === null || typeof parsedBody !== "object") {
    throw new ProviderFetchError({
      details: summarizeText(rawBody),
      message: `${PROVIDER_LABELS[provider]} returned an unreadable response while ${operation}.`,
      operation,
      provider,
      status: response.status,
    })
  }

  return parsedBody as T
}

export function getProviderErrorPayload(
  error: unknown,
  fallbackMessage: string,
) {
  if (isProviderFetchError(error)) {
    return {
      details: error.details ?? undefined,
      error: error.message,
      provider: error.provider,
      status: error.status ?? undefined,
    }
  }

  return {
    error: fallbackMessage,
  }
}
