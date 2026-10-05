export function isValidMediaDateKey(value: string | null | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const date = new Date(`${value}T12:00:00`)
  return !Number.isNaN(date.getTime())
}

export function parseMediaDateKey(value: string | null | undefined) {
  if (!isValidMediaDateKey(value)) {
    return new Date()
  }

  return new Date(`${value}T12:00:00`)
}

export function formatMediaDateKey(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, "0")
  const day = String(value.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

export function formatMediaDateLabel(value: string | null | undefined, fallback = "Any") {
  if (!isValidMediaDateKey(value)) {
    return fallback
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parseMediaDateKey(value))
}
