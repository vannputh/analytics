import {
  DINING_OPTIONS,
  formatCurrency,
  formatNumber,
  type FoodMetrics,
} from "@analytics/domain"

import {
  createAnalyticsFraction,
  createRankedBreakdownData,
  formatAnalyticsMonthParts,
  type AnalyticsBreakdownSectionModel,
  type AnalyticsKpiModel,
  type AnalyticsMonthlySectionModel,
} from "@/features/analytics/shared/analytics-models"

function formatDiningLabel(value: string) {
  return DINING_OPTIONS.find((option) => option.value === value)?.label ?? value
}

function formatReturnRate(metrics: FoodMetrics) {
  if (metrics.totalVisits <= 0) {
    return "—"
  }

  return `${formatNumber((metrics.wouldReturnCount / metrics.totalVisits) * 100, 0)}%`
}

export function createFoodAnalyticsKpis(metrics: FoodMetrics): AnalyticsKpiModel[] {
  return [
    {
      detail: `${formatNumber(metrics.uniquePlaces)} unique places`,
      icon: "fork.knife",
      key: "total-visits",
      label: "Total Visits",
      value: formatNumber(metrics.totalVisits),
    },
    {
      detail: metrics.averagePrice > 0 ? `Avg ${formatCurrency(metrics.averagePrice)}/visit` : "No spend data",
      icon: "dollarsign.circle",
      key: "total-spent",
      label: "Total Spent",
      value: formatCurrency(metrics.totalSpent),
    },
    {
      detail: metrics.averageRating > 0 ? "Out of 5" : "No ratings",
      icon: "star",
      key: "average-rating",
      label: "Avg Rating",
      value: metrics.averageRating > 0 ? formatNumber(metrics.averageRating, 1) : "—",
    },
    {
      detail:
        metrics.topCity && metrics.countByCity[metrics.topCity]
          ? `${formatNumber(metrics.countByCity[metrics.topCity])} visits`
          : "No city data",
      icon: "mappin.and.ellipse",
      key: "top-city",
      label: "Top City",
      value: metrics.topCity ?? "—",
    },
    {
      detail:
        metrics.topCategory && metrics.countByCategory[metrics.topCategory]
          ? `${formatNumber(metrics.countByCategory[metrics.topCategory])} visits`
          : "No type data",
      icon: "square.grid.2x2",
      key: "top-category",
      label: "Top Food Type",
      value: metrics.topCategory ?? "—",
    },
    {
      detail: `${formatNumber(metrics.wouldReturnCount)} marked return`,
      icon: "arrow.uturn.backward.circle",
      key: "would-return",
      label: "Would Return",
      value: formatReturnRate(metrics),
    },
  ]
}

export function createFoodAnalyticsMonthlySections(
  metrics: FoodMetrics,
): AnalyticsMonthlySectionModel[] {
  const visitMax = Math.max(...metrics.countByMonth.map((item) => item.count), 0)
  const spendingMax = Math.max(...metrics.spentByMonth.map((item) => item.amount), 0)

  return [
    {
      emptyMessage: "No visits for the current filters.",
      items: metrics.countByMonth.map((item) => {
        const monthParts = formatAnalyticsMonthParts(item.month)

        return {
          fraction: createAnalyticsFraction(item.count, visitMax),
          key: item.month,
          label: monthParts.label,
          secondaryLabel: monthParts.secondaryLabel,
          value: item.count,
          valueLabel: formatNumber(item.count),
        }
      }),
      key: "visits",
      title: "Visits by Month",
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
  ]
}

export function createFoodAnalyticsBreakdownSections(
  metrics: FoodMetrics,
): AnalyticsBreakdownSectionModel[] {
  return [
    {
      emptyMessage: "No cuisine data for the current filters.",
      items: createRankedBreakdownData(metrics.countByCuisine),
      key: "cuisines",
      title: "Cuisines",
    },
    {
      emptyMessage: "No city data for the current filters.",
      items: createRankedBreakdownData(metrics.countByCity),
      key: "cities",
      title: "Cities",
    },
    {
      emptyMessage: "No food-type data for the current filters.",
      items: createRankedBreakdownData(metrics.countByCategory),
      key: "categories",
      title: "Food Types",
    },
    {
      emptyMessage: "No dining-type data for the current filters.",
      items: createRankedBreakdownData(metrics.countByDiningType).map((item) => ({
        ...item,
        label: formatDiningLabel(item.key),
      })),
      key: "dining",
      title: "Dining",
    },
  ]
}
