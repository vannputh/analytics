import { Pressable, Text, View } from "react-native"

import { MEDIA_PRIMARY_TINT, MEDIA_PRIMARY_TINT_MUTED } from "@/features/media/media-ui"

interface FoodDayCellProps {
  compact?: boolean
  count: number
  day: number
  isCurrentMonth: boolean
  isSelected: boolean
  isToday: boolean
  onPress(): void
}

export function FoodDayCell({
  compact = false,
  count,
  day,
  isCurrentMonth,
  isSelected,
  isToday,
  onPress,
}: FoodDayCellProps) {
  const size = compact ? 30 : 34
  const numberColor = isSelected
    ? "#FFFFFF"
    : isCurrentMonth
      ? MEDIA_PRIMARY_TINT
      : MEDIA_PRIMARY_TINT_MUTED

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      hitSlop={4}
      onPress={onPress}
      style={{
        minHeight: compact ? 48 : 54,
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: 2,
        gap: 4,
      }}
    >
      <View
        style={{
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 999,
          borderCurve: "continuous",
          backgroundColor: isSelected
            ? MEDIA_PRIMARY_TINT
            : isToday
              ? "rgba(17, 17, 17, 0.08)"
              : "transparent",
        }}
      >
        <Text
          selectable
          style={{
            fontSize: compact ? 15 : 16,
            fontWeight: isToday || isSelected ? "700" : "500",
            color: numberColor,
            opacity: isCurrentMonth ? 1 : 0.38,
            fontVariant: ["tabular-nums"],
          }}
        >
          {day}
        </Text>
      </View>

      <View style={{ height: 6, flexDirection: "row", alignItems: "center", gap: 3 }}>
        {Array.from({ length: Math.min(count, 3) }).map((_, index) => (
          <View
            key={index}
            style={{
              width: 4,
              height: 4,
              borderRadius: 999,
              backgroundColor: isSelected ? MEDIA_PRIMARY_TINT : "rgba(17, 17, 17, 0.45)",
            }}
          />
        ))}
      </View>
    </Pressable>
  )
}
