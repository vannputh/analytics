import { Link } from "expo-router"
import { PlatformColor, ScrollView, Text, View } from "react-native"

export default function NotFound() {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: PlatformColor("systemGroupedBackground") }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 24, gap: 18 }}
    >
      <View style={{ gap: 10 }}>
        <Text selectable style={{ fontSize: 28, fontWeight: "700", color: PlatformColor("label") }}>
          Screen not found
        </Text>
        <Text selectable style={{ fontSize: 16, lineHeight: 22, color: PlatformColor("secondaryLabel") }}>
          This screen is not part of the native app yet.
        </Text>
      </View>
      <Link href="/media" style={{ color: "#111111", fontSize: 16, fontWeight: "600" }}>
        Back to Diary
      </Link>
    </ScrollView>
  )
}
