import {
  formatCurrency,
  formatDuration,
  formatNumber,
  type MediaMetrics,
} from "@analytics/domain"

import {
  createAnalyticsFraction,
  createRankedBreakdownData,
  formatAnalyticsMonthParts,
  type AnalyticsBreakdownItem,
  type AnalyticsBreakdownSectionModel,
  type AnalyticsKpiModel,
  type AnalyticsMonthlySectionModel,
} from "@/features/analytics/shared/analytics-models"

export type MediaAnalyticsKpiModel = AnalyticsKpiModel
export type MediaAnalyticsMonthlySectionModel = AnalyticsMonthlySectionModel
export type MediaAnalyticsBreakdownItem = AnalyticsBreakdownItem
export type MediaAnalyticsBreakdownSectionModel = AnalyticsBreakdownSectionModel

export { createRankedBreakdownData }

export function createMediaAnalyticsKpis(metrics: MediaMetrics): MediaAnalyticsKpiModel[] {
  return [
    {
      detail: `Avg ${formatCurrency(metrics.averagePrice)}/item`,
      icon: "dollarsign.circle",
      key: "total-spent",
      label: "Total Spent",
      value: formatCurrency(metrics.totalSpent),
    },
    {
      detail: formatDuration(metrics.totalMinutes),
      icon: "clock",
      key: "hours-watched",
      label: "Hours Watched",
      value: formatNumber(metrics.totalHours, 1),
    },
    {
      detail: "Spent consuming media",
      icon: "calendar",
      key: "days-of-life",
      label: "Days of Life",
      value: formatNumber(metrics.daysWatched, 2),
    },
    {
      detail: metrics.topMedium ? `Mostly ${metrics.topMedium}` : "No medium data",
      icon: "checkmark.circle",
      key: "items-finished",
      label: "Items Finished",
      value: formatNumber(metrics.totalItems),
    },
    {
      detail: metrics.averageRating > 0 ? "Out of 10" : "No ratings",
      icon: "star",
      key: "average-rating",
      label: "Avg Rating",
      value: metrics.averageRating > 0 ? formatNumber(metrics.averageRating, 1) : "—",
    },
    {
      detail:
        metrics.topGenre && metrics.countByGenre[metrics.topGenre]
          ? `${formatNumber(metrics.countByGenre[metrics.topGenre])} items`
          : "No genre data",
      icon: "film",
      key: "top-genre",
      label: "Top Genre",
      value: metrics.topGenre ?? "—",
    },
    {
      detail:
        metrics.topLanguage && metrics.countByLanguage[metrics.topLanguage]
          ? `${formatNumber(metrics.countByLanguage[metrics.topLanguage])} items`
          : "No language data",
      icon: "globe",
      key: "top-language",
      label: "Top Language",
      value: metrics.topLanguage ?? "—",
    },
    {
      detail: "Unique genres",
      icon: "square.stack.3d.up",
      key: "genres",
      label: "Genres",
      value: formatNumber(Object.keys(metrics.countByGenre).length),
    },
    {
      detail: "Different languages",
      icon: "textformat.abc",
      key: "languages",
      label: "Languages",
      value: formatNumber(Object.keys(metrics.countByLanguage).length),
    },
    {
      detail: metrics.topPlatform ? `Top ${metrics.topPlatform}` : "No platform data",
      icon: "tv",
      key: "platforms",
      label: "Platforms",
      value: formatNumber(Object.keys(metrics.countByPlatform).length),
    },
  ]
}

export function createMediaAnalyticsMonthlySections(
  metrics: MediaMetrics,
): MediaAnalyticsMonthlySectionModel[] {
  const watchTimeMax = Math.max(...metrics.minutesByMonth.map((item) => item.minutes / 60), 0)
  const spendingMax = Math.max(...metrics.spentByMonth.map((item) => item.amount), 0)
  const completionMax = Math.max(...metrics.countByMonth.map((item) => item.count), 0)

  return [
    {
      emptyMessage: "No watch-time data for the current filters.",
      items: metrics.minutesByMonth.map((item) => {
        const value = Math.round((item.minutes / 60) * 10) / 10
        const monthParts = formatAnalyticsMonthParts(item.month)

        return {
          fraction: createAnalyticsFraction(value, watchTimeMax),
          key: item.month,
          label: monthParts.label,
          secondaryLabel: monthParts.secondaryLabel,
          value,
          valueLabel: `${formatNumber(value, value % 1 === 0 ? 0 : 1)}h`,
        }
      }),
      key: "watch-time",
      title: "Watch Time by Month",
    },
    {
      emptyMessage: "No spending data for the current filters.",
      items: metrics.spentByMonth.map((item) => {
        const monthParts = formatAnalyticsMonthParts(item.month)

        return {
          fraction: createAnalyticsFraction(item.amount, spendingMax),
          key: item.month,
          label: monthParts.label,
          secondaryLabel: monthParts.secondaryLabel,
          value: item.amount,
          valueLabel: formatCurrency(item.amount),
        }
      }),
      key: "spending",
      title: "Spending by Month",
    },
    {
      emptyMessage: "No completed items for the current filters.",
      items: metrics.countByMonth.map((item) => {
        const monthParts = formatAnalyticsMonthParts(item.month)

        return {
          fraction: createAnalyticsFraction(item.count, completionMax),
          key: item.month,
          label: monthParts.label,
          secondaryLabel: monthParts.secondaryLabel,
          value: item.count,
          valueLabel: formatNumber(item.count),
        }
      }),
      key: "completed",
      title: "Completed by Month",
    },
  ]
}

export function createMediaAnalyticsBreakdownSections(
  metrics: MediaMetrics,
): MediaAnalyticsBreakdownSectionModel[] {
  return [
    {
      emptyMessage: "No genre data for the current filters.",
      items: createRankedBreakdownData(metrics.countByGenre),
      key: "genres",
      title: "Genres",
    },
    {
      emptyMessage: "No language data for the current filters.",
      items: createRankedBreakdownData(metrics.countByLanguage),
      key: "languages",
      title: "Languages",
    },
    {
      emptyMessage: "No platform data for the current filters.",
      items: createRankedBreakdownData(metrics.countByPlatform),
      key: "platforms",
      title: "Platforms",
    },
    {
      emptyMessage: "No status data for the current filters.",
      items: createRankedBreakdownData(metrics.countByStatus),
      key: "statuses",
      title: "Statuses",
    },
  ]
}
