import type { StyleProp, ViewStyle } from "react-native"

import { MediaButton } from "@/features/media/media-button"

type MediaActionButtonVariant = "solid" | "muted" | "glass"
type MediaActionButtonSize = "default" | "compact"

export function MediaActionButton({
  disabled = false,
  label,
  onPress,
  size = "default",
  style,
  variant = "glass",
}: {
  disabled?: boolean
  label: string
  onPress(): void
  size?: MediaActionButtonSize
  style?: StyleProp<ViewStyle>
  variant?: MediaActionButtonVariant
}) {
  return (
    <MediaButton
      disabled={disabled}
      label={label}
      onPress={onPress}
      size={size === "compact" ? "compact" : "regular"}
      style={style}
      variant={variant === "solid" ? "primary" : variant === "muted" ? "secondary" : "glass"}
    />
  )
}
