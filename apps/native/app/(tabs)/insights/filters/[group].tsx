import { FoodAnalyticsFilterGroupScreen } from "@/features/analytics/food/food-analytics-filter-group-screen"
import { useInsightsWorkspace } from "@/features/analytics/insights-workspace"
import { MediaAnalyticsFilterGroupScreen } from "@/features/analytics/media/media-analytics-filter-group-screen"

export default function InsightsFilterGroupRoute() {
  const { workspace } = useInsightsWorkspace()

  return workspace === "food" ? <FoodAnalyticsFilterGroupScreen /> : <MediaAnalyticsFilterGroupScreen />
}
