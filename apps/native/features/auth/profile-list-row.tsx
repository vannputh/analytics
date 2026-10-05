import { PlatformColor, StyleSheet, Text, View } from "react-native"

import { Symbol } from "@/components/symbol"

export function ProfileListRow({
  icon,
  isLast = false,
  label,
  value,
}: {
  icon: string
  isLast?: boolean
  label: string
  value: string
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 14,
        borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: PlatformColor("separator"),
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 14,
          borderCurve: "continuous",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: PlatformColor("secondarySystemGroupedBackground"),
        }}
      >
        <Symbol name={icon} size={16} tintColor={PlatformColor("secondaryLabel")} />
      </View>

      <View style={{ flex: 1, gap: 3, minWidth: 0 }}>
        <Text selectable style={{ fontSize: 13, fontWeight: "600", color: PlatformColor("secondaryLabel") }}>
          {label}
        </Text>
        <Text selectable numberOfLines={2} style={{ fontSize: 16, lineHeight: 21, color: PlatformColor("label") }}>
          {value}
        </Text>
      </View>
    </View>
  )
}
