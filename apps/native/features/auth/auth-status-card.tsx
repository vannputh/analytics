import { Text, View } from "react-native"

import type { AuthStatusNotice, AuthStatusTone } from "@/features/auth/auth-types"

const toneStyles: Record<
  AuthStatusTone,
  {
    backgroundColor: string
    borderColor: string
    textColor: string
    titleColor: string
  }
> = {
  error: {
    backgroundColor: "#FAFAFA",
    borderColor: "#E4E4E7",
    textColor: "#52525B",
    titleColor: "#111111",
  },
  info: {
    backgroundColor: "#FAFAFA",
    borderColor: "#E4E4E7",
    textColor: "#52525B",
    titleColor: "#111111",
  },
  success: {
    backgroundColor: "#FAFAFA",
    borderColor: "#E4E4E7",
    textColor: "#52525B",
    titleColor: "#111111",
  },
  warning: {
    backgroundColor: "#FAFAFA",
    borderColor: "#E4E4E7",
    textColor: "#52525B",
    titleColor: "#111111",
  },
}

export function AuthStatusCard({ notice }: { notice: AuthStatusNotice }) {
  const styles = toneStyles[notice.tone]

  return (
    <View
      style={{
        padding: 16,
        gap: 6,
        borderRadius: 20,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: styles.borderColor,
        backgroundColor: styles.backgroundColor,
      }}
    >
      <Text selectable style={{ fontSize: 15, fontWeight: "700", color: styles.titleColor }}>
        {notice.title}
      </Text>
      <Text selectable style={{ fontSize: 14, lineHeight: 20, color: styles.textColor }}>
        {notice.detail}
      </Text>
    </View>
  )
}
