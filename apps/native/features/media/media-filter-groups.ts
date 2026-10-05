import type { FilterState } from "@analytics/domain"

export type MediaFilterGroupKey = Exclude<keyof FilterState, "dateFrom" | "dateTo">

export interface MediaFilterGroupConfig {
  key: MediaFilterGroupKey
  title: string
}

export const MEDIA_FILTER_GROUPS: MediaFilterGroupConfig[] = [
  { key: "genres", title: "Genres" },
  { key: "mediums", title: "Mediums" },
  { key: "languages", title: "Languages" },
  { key: "platforms", title: "Platforms" },
  { key: "statuses", title: "Statuses" },
  { key: "types", title: "Types" },
]

export function isMediaFilterGroupKey(value: string): value is MediaFilterGroupKey {
  return MEDIA_FILTER_GROUPS.some((group) => group.key === value)
}

export function getMediaFilterGroupConfig(groupKey: string) {
  return MEDIA_FILTER_GROUPS.find((group) => group.key === groupKey) ?? null
}

export function summarizeMediaFilterGroupSelection(
  filters: FilterState,
  groupKey: MediaFilterGroupKey,
) {
  const values = filters[groupKey]

  if (values.length === 0) {
    return "Any"
  }

  if (values.length <= 2) {
    return values.join(", ")
  }

  return `${values.length} selected`
}
