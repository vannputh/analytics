import { forwardRef } from "react"
import { PlatformColor, TextInput, type TextInputProps } from "react-native"

import {
  MEDIA_CONTROL_RADIUS,
  MEDIA_FORM_FILL,
  MEDIA_INPUT_MIN_HEIGHT,
  MEDIA_PRIMARY_TINT,
} from "@/features/media/media-ui"

export const MediaTextField = forwardRef<TextInput, TextInputProps>(function MediaTextField(
  {
    multiline,
    style,
    ...props
  },
  ref,
) {
  return (
    <TextInput
      {...props}
      ref={ref}
      autoCorrect={false}
      multiline={multiline}
      placeholderTextColor={PlatformColor("secondaryLabel") as unknown as string}
      style={[
        {
          minHeight: multiline ? 96 : MEDIA_INPUT_MIN_HEIGHT,
          borderRadius: MEDIA_CONTROL_RADIUS,
          borderCurve: "continuous",
          backgroundColor: MEDIA_FORM_FILL,
          paddingHorizontal: 16,
          paddingVertical: 14,
          fontSize: 16,
          color: MEDIA_PRIMARY_TINT,
          textAlignVertical: multiline ? "top" : "center",
        },
        style,
      ]}
    />
  )
})
