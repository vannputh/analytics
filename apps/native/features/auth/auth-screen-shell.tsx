import type { ReactNode } from "react"

import { ScrollView, Text, View, useWindowDimensions } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

interface AuthScreenShellLayout {
  availableHeight: number
  compact: boolean
  contentGap: number
  dense: boolean
  inputPaddingVertical: number
  sectionGap: number
}

interface AuthScreenShellProps {
  brand?: string
  children(layout: AuthScreenShellLayout): ReactNode
  detail: string
  keyboardInset?: number
  title: string
}

export function AuthScreenShell({
  brand = "analytics",
  children,
  detail,
  keyboardInset = 0,
  title,
}: AuthScreenShellProps) {
  const insets = useSafeAreaInsets()
  const { height } = useWindowDimensions()

  const availableHeight = Math.max(height - insets.top - insets.bottom, 0)
  const keyboardVisible = keyboardInset > 0
  const dense = availableHeight < 720
  const compact = availableHeight < 820
  const cardPadding = dense ? 22 : compact ? 26 : 30
  const contentGap = dense ? 14 : compact ? 18 : 20
  const sectionGap = dense ? 12 : 14
  const horizontalPadding = dense ? 20 : 24
  const restingCardMinHeight = Math.min(
    Math.max(
      Math.round(availableHeight * (dense ? 0.36 : compact ? 0.42 : 0.48)),
      dense ? 260 : 340,
    ),
    Math.max(availableHeight - (dense ? 144 : 184), dense ? 260 : 340),
  )
  const restingBrandTopOffset = Math.min(
    Math.max(Math.round(availableHeight * (dense ? 0.06 : compact ? 0.1 : 0.12)), dense ? 24 : compact ? 48 : 72),
    dense ? 56 : compact ? 88 : 128,
  )
  const brandTopOffset = keyboardVisible ? (dense ? 12 : 18) : restingBrandTopOffset
  const brandPaddingTop = keyboardVisible ? (dense ? 6 : 10) : dense ? 18 : 24
  const brandPaddingBottom = keyboardVisible ? (dense ? 10 : 14) : dense ? 18 : 34
  const contentMinHeight = Math.max(height, availableHeight + insets.top + insets.bottom)
  const layout: AuthScreenShellLayout = {
    availableHeight,
    compact,
    contentGap,
    dense,
    inputPaddingVertical: dense ? 13 : 15,
    sectionGap,
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={{
          flex: 1,
          backgroundColor: "#000000",
        }}
        contentContainerStyle={{
          minHeight: contentMinHeight,
          paddingTop: insets.top + brandTopOffset,
          paddingHorizontal: horizontalPadding,
        }}
      >
        <View
          style={{
            flexGrow: 1,
            width: "100%",
            maxWidth: 420,
            alignSelf: "center",
          }}
        >
          <View
            style={{
              paddingTop: brandPaddingTop,
              paddingBottom: brandPaddingBottom,
              paddingHorizontal: 12,
            }}
          >
            <Text
              selectable
              style={{
                textAlign: "center",
                fontSize: dense ? 26 : 28,
                fontWeight: "700",
                letterSpacing: -0.9,
                color: "#FFFFFF",
                textTransform: "lowercase",
              }}
            >
              {brand}
            </Text>
          </View>

          <View style={{ flexGrow: 1, justifyContent: "flex-end" }}>
            <View
              style={{
                minHeight: keyboardVisible ? undefined : restingCardMinHeight,
                gap: contentGap,
                paddingTop: keyboardVisible ? cardPadding - 2 : cardPadding,
                paddingHorizontal: cardPadding,
                paddingBottom:
                  cardPadding +
                  (keyboardVisible ? Math.max(insets.bottom, dense ? 10 : 14) : Math.max(insets.bottom, dense ? 6 : 8)) +
                  keyboardInset,
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                borderCurve: "continuous",
                backgroundColor: "#FFFFFF",
              }}
            >
              <View style={{ gap: dense ? 4 : 6 }}>
                <Text
                  selectable
                  style={{
                    fontSize: dense ? 24 : 28,
                    fontWeight: "700",
                    color: "#111111",
                  }}
                >
                  {title}
                </Text>
                <Text
                  selectable
                  style={{
                    fontSize: dense ? 14 : 15,
                    lineHeight: dense ? 20 : 22,
                    color: "#52525B",
                  }}
                >
                  {detail}
                </Text>
              </View>

              <View style={{ flexGrow: 1 }}>{children(layout)}</View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
