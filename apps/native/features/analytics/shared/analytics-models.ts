import { formatNumber } from "@analytics/domain"

export interface AnalyticsKpiModel {
  detail: string
  icon: string
  key: string
  label: string
  value: string
}

export interface AnalyticsMonthlyDatum {
  fraction: number
  key: string
  label: string
  secondaryLabel: string
  value: number
  valueLabel: string
}

export interface AnalyticsMonthlySectionModel {
  emptyMessage: string
  items: AnalyticsMonthlyDatum[]
  key: string
  title: string
}

export interface AnalyticsBreakdownItem {
  fraction: number
  key: string
  label: string
  value: number
  valueLabel: string
}

export interface AnalyticsBreakdownSectionModel {
  emptyMessage: string
  items: AnalyticsBreakdownItem[]
  key: string
  title: string
}

export function createAnalyticsFraction(value: number, maxValue: number) {
  if (maxValue <= 0 || value <= 0) {
    return 0
  }

  return value / maxValue
}

export function formatAnalyticsMonthParts(monthKey: string) {
  const date = new Date(`${monthKey}-01T12:00:00`)

  if (Number.isNaN(date.getTime())) {
    return {
      label: monthKey,
      secondaryLabel: "",
    }
  }

  return {
    label: new Intl.DateTimeFormat("en-US", { month: "short" }).format(date),
    secondaryLabel: new Intl.DateTimeFormat("en-US", { year: "2-digit" }).format(date),
  }
}

export function createRankedBreakdownData(
  values: Record<string, number>,
  limit = 6,
): AnalyticsBreakdownItem[] {
  const items = Object.entries(values)
    .filter(([, value]) => value > 0)
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)

  const maxValue = items[0]?.[1] ?? 0

  return items.map(([label, value]) => ({
    fraction: createAnalyticsFraction(value, maxValue),
    key: label,
    label,
    value,
    valueLabel: formatNumber(value),
  }))
}
