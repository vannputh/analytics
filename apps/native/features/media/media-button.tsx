import { Pressable, Text, View, type StyleProp, type ViewStyle } from "react-native"

import { AdaptiveGlass } from "@/components/adaptive-glass"
import { Symbol } from "@/components/symbol"
import {
  getMediaButtonAppearance,
  type MediaButtonAppearance,
  type MediaButtonTone,
  type MediaButtonVariant,
} from "@/features/media/media-button-appearance"

export type { MediaButtonTone, MediaButtonVariant } from "@/features/media/media-button-appearance"
export type MediaButtonSize = "compact" | "regular"

function getMediaButtonMetrics(size: MediaButtonSize, iconOnly: boolean) {
  if (size === "compact") {
    return {
      borderRadius: iconOnly ? 17 : 16,
      gap: iconOnly ? 0 : 6,
      minHeight: 34,
      minWidth: iconOnly ? 34 : undefined,
      paddingHorizontal: iconOnly ? 0 : 12,
      paddingVertical: iconOnly ? 0 : 8,
      textSize: 13,
    }
  }

  return {
    borderRadius: iconOnly ? 24 : 18,
    gap: iconOnly ? 0 : 8,
    minHeight: 50,
    minWidth: iconOnly ? 50 : undefined,
    paddingHorizontal: iconOnly ? 0 : 14,
    paddingVertical: iconOnly ? 0 : 13,
    textSize: 15,
  }
}

function MediaButtonContainer({
  appearance,
  children,
  style,
}: {
  appearance: MediaButtonAppearance
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
}) {
  const baseStyle: StyleProp<ViewStyle> = [
    {
      backgroundColor: appearance.useGlass ? "transparent" : appearance.backgroundColor,
      borderColor: appearance.borderColor,
      borderWidth: appearance.borderWidth,
      overflow: "hidden",
    },
    style,
  ]

  if (appearance.useGlass) {
    return (
      <AdaptiveGlass isInteractive style={baseStyle}>
        {children}
      </AdaptiveGlass>
    )
  }

  return <View style={baseStyle}>{children}</View>
}

export function MediaButton({
  align = "center",
  detail,
  disabled = false,
  fullWidth = false,
  icon,
  label,
  onPress,
  selected = false,
  size = "regular",
  style,
  tone = "light",
  variant = "secondary",
}: {
  align?: "center" | "leading"
  detail?: string
  disabled?: boolean
  fullWidth?: boolean
  icon?: string
  label: string
  onPress(): void
  selected?: boolean
  size?: MediaButtonSize
  style?: StyleProp<ViewStyle>
  tone?: MediaButtonTone
  variant?: MediaButtonVariant
}) {
  const appearance = getMediaButtonAppearance({ disabled, selected, tone, variant })
  const metrics = getMediaButtonMetrics(size, false)

  return (
    <MediaButtonContainer
      appearance={appearance}
      style={[
        {
          borderRadius: metrics.borderRadius,
          borderCurve: "continuous",
          width: fullWidth ? "100%" : undefined,
        },
        style,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => ({
          minHeight: metrics.minHeight,
          paddingHorizontal: metrics.paddingHorizontal,
          paddingVertical: metrics.paddingVertical,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: align === "leading" ? "flex-start" : "center",
          gap: metrics.gap,
          opacity: pressed && !disabled ? appearance.pressedOpacity : disabled ? 0.45 : 1,
        })}
      >
        {icon ? <Symbol name={icon} size={size === "compact" ? 14 : 16} tintColor={appearance.iconTint} /> : null}
        <View style={{ alignItems: align === "leading" ? "flex-start" : "center", gap: detail ? 2 : 0 }}>
          <Text
            selectable
            style={{
              fontSize: metrics.textSize,
              fontWeight: size === "compact" ? "700" : "600",
              color: appearance.textColor,
            }}
          >
            {label}
          </Text>
          {detail ? (
            <Text selectable style={{ fontSize: 11, color: appearance.detailColor }}>
              {detail}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </MediaButtonContainer>
  )
}

export function MediaIconButton({
  accessibilityLabel,
  disabled = false,
  icon,
  onPress,
  selected = false,
  size = "compact",
  style,
  tone = "light",
  variant = "glass",
}: {
  accessibilityLabel?: string
  disabled?: boolean
  icon: string
  onPress(): void
  selected?: boolean
  size?: MediaButtonSize
  style?: StyleProp<ViewStyle>
  tone?: MediaButtonTone
  variant?: MediaButtonVariant
}) {
  const appearance = getMediaButtonAppearance({ disabled, selected, tone, variant })
  const metrics = getMediaButtonMetrics(size, true)

  return (
    <MediaButtonContainer
      appearance={appearance}
      style={[
        {
          borderRadius: metrics.borderRadius,
          borderCurve: "continuous",
          width: metrics.minWidth,
          minWidth: metrics.minWidth,
        },
        style,
      ]}
    >
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => ({
          width: metrics.minWidth,
          minHeight: metrics.minHeight,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed && !disabled ? appearance.pressedOpacity : disabled ? 0.45 : 1,
        })}
      >
        <Symbol name={icon} size={size === "compact" ? 16 : 18} tintColor={appearance.iconTint} />
      </Pressable>
    </MediaButtonContainer>
  )
}
