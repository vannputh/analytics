import { FoodAnalyticsFilterScreen } from "@/features/analytics/food/food-analytics-filter-screen"
import { useInsightsWorkspace } from "@/features/analytics/insights-workspace"
import { MediaAnalyticsFilterScreen } from "@/features/analytics/media/media-analytics-filter-screen"

export default function InsightsFiltersRoute() {
  const { workspace } = useInsightsWorkspace()

  return workspace === "food" ? <FoodAnalyticsFilterScreen /> : <MediaAnalyticsFilterScreen />
}
