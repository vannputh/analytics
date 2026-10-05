import { ActivityIndicator, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

interface AuthStartupScreenProps {
  brand?: string
  detail: string
  loading?: boolean
  title: string
}

export function AuthStartupScreen({
  brand = "analytics",
  detail,
  loading = false,
  title,
}: AuthStartupScreenProps) {
  const insets = useSafeAreaInsets()

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#000000",
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingHorizontal: 24,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text
        selectable
        style={{
          fontSize: 32,
          fontWeight: "700",
          letterSpacing: -0.9,
          color: "#FFFFFF",
          textTransform: "lowercase",
        }}
      >
        {brand}
      </Text>
      {loading ? (
        <ActivityIndicator color="#FFFFFF" style={{ marginTop: 14 }} />
      ) : (
        <View style={{ marginTop: 28, gap: 10, alignItems: "center", maxWidth: 320 }}>
          <Text
            selectable
            style={{
              fontSize: 17,
              fontWeight: "600",
              color: "#FFFFFF",
              textAlign: "center",
            }}
          >
            {title}
          </Text>
          <Text
            selectable
            style={{
              fontSize: 15,
              lineHeight: 22,
              color: "#A1A1AA",
              textAlign: "center",
            }}
          >
            {detail}
          </Text>
        </View>
      )}
    </View>
  )
}
