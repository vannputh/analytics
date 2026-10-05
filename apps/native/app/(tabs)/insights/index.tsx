import { View } from "react-native"

import * as Haptics from "expo-haptics"
import SegmentedControl from "@react-native-segmented-control/segmented-control"

import { FoodAnalyticsScreen } from "@/features/analytics/food/food-analytics-screen"
import { useInsightsWorkspace } from "@/features/analytics/insights-workspace"
import { MediaAnalyticsScreen } from "@/features/analytics/media/media-analytics-screen"
import { MEDIA_LAYOUT_SIDE_PADDING } from "@/features/media/media-ui"

export default function InsightsScreen() {
  const { setWorkspace, workspace } = useInsightsWorkspace()

  return (
    <View style={{ flex: 1, backgroundColor: "transparent" }}>
      <View
        style={{
          paddingHorizontal: MEDIA_LAYOUT_SIDE_PADDING,
          paddingTop: 4,
          paddingBottom: 8,
        }}
      >
        <SegmentedControl
          appearance="light"
          fontStyle={{ fontWeight: "600" }}
          onChange={(event) => {
            const nextWorkspace = event.nativeEvent.selectedSegmentIndex === 1 ? "food" : "media"
            if (nextWorkspace !== workspace && process.env.EXPO_OS === "ios") {
              void Haptics.selectionAsync()
            }
            setWorkspace(nextWorkspace)
          }}
          selectedIndex={workspace === "food" ? 1 : 0}
          tintColor="#FFFFFF"
          values={["Media", "Food"]}
        />
      </View>
      {workspace === "food" ? <FoodAnalyticsScreen /> : <MediaAnalyticsScreen />}
    </View>
  )
}
