export function getMonthBucketKey(dateStr: string | null): string | null {
  if (!dateStr) return null

  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return null

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}
