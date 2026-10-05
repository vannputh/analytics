import { useState } from "react"
import { Pressable, Text, View } from "react-native"

import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker"

import { MediaButton } from "@/features/media/media-button"
import {
  formatMediaDateKey,
  formatMediaDateLabel,
  parseMediaDateKey,
} from "@/features/media/media-date"
import {
  MEDIA_CONTROL_RADIUS,
  MEDIA_FORM_FILL,
  MEDIA_PRIMARY_TINT,
  MEDIA_PRIMARY_TINT_MUTED,
} from "@/features/media/media-ui"

export function MediaDateField({
  placeholder = "Choose date",
  value,
  onChange,
}: {
  placeholder?: string
  value: string | null | undefined
  onChange(value: string | null): void
}) {
  const [showPicker, setShowPicker] = useState(false)

  function handleChange(event: DateTimePickerEvent, nextDate?: Date) {
    if (process.env.EXPO_OS !== "ios") {
      setShowPicker(false)
    }

    if (event.type === "dismissed") {
      return
    }

    if (nextDate) {
      onChange(formatMediaDateKey(nextDate))
    }
  }

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setShowPicker((current) => !current)}
          style={{
            flex: 1,
            minHeight: 52,
            justifyContent: "center",
            borderRadius: MEDIA_CONTROL_RADIUS,
            borderCurve: "continuous",
            backgroundColor: MEDIA_FORM_FILL,
            paddingHorizontal: 16,
            paddingVertical: 14,
          }}
        >
          <Text selectable style={{ fontSize: 16, color: value ? MEDIA_PRIMARY_TINT : MEDIA_PRIMARY_TINT_MUTED }}>
            {formatMediaDateLabel(value, placeholder)}
          </Text>
        </Pressable>
        {value ? (
          <MediaButton
            label="Clear"
            onPress={() => onChange(null)}
            size="compact"
            variant="secondary"
          />
        ) : null}
      </View>

      {showPicker ? (
        <DateTimePicker
          display={process.env.EXPO_OS === "ios" ? "inline" : "default"}
          mode="date"
          onChange={handleChange}
          value={parseMediaDateKey(value)}
        />
      ) : null}
    </View>
  )
}
