import { type StyleProp, type ViewStyle } from "react-native"

import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect"
import { BlurView } from "expo-blur"

interface AdaptiveGlassProps {
  children?: React.ReactNode
  style?: StyleProp<ViewStyle>
  isInteractive?: boolean
  /** For BlurView fallback; defaults to systemUltraThinMaterial */
  blurTint?: React.ComponentProps<typeof BlurView>["tint"]
  /** For BlurView fallback intensity; defaults to 80 */
  blurIntensity?: number
}

/**
 * Renders iOS 26 liquid glass on devices that support it,
 * and falls back to a BlurView with systemUltraThinMaterial on older iOS.
 */
export function AdaptiveGlass({
  children,
  style,
  isInteractive = false,
  blurTint = "systemUltraThinMaterial",
  blurIntensity = 80,
}: AdaptiveGlassProps) {
  if (isLiquidGlassAvailable()) {
    return (
      <GlassView isInteractive={isInteractive} style={style}>
        {children}
      </GlassView>
    )
  }

  return (
    <BlurView tint={blurTint} intensity={blurIntensity} style={[{ overflow: "hidden" }, style]}>
      {children}
    </BlurView>
  )
}
