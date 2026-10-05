export type MediaButtonVariant = "primary" | "secondary" | "glass" | "destructive" | "chip"
export type MediaButtonTone = "light" | "dark"

export interface MediaButtonAppearance {
  backgroundColor: string
  borderColor: string
  borderWidth: number
  detailColor: string
  iconTint: string
  pressedOpacity: number
  textColor: string
  useGlass: boolean
}

interface MediaButtonAppearanceInput {
  disabled?: boolean
  selected?: boolean
  tone?: MediaButtonTone
  variant?: MediaButtonVariant
}

function isDarkTone(tone: MediaButtonTone) {
  return tone === "dark"
}

export function getMediaButtonAppearance({
  disabled = false,
  selected = false,
  tone = "light",
  variant = "secondary",
}: MediaButtonAppearanceInput): MediaButtonAppearance {
  const darkTone = isDarkTone(tone)

  const base = {
    pressedOpacity: disabled ? 0.45 : 0.82,
  }

  if (variant === "primary") {
    return {
      ...base,
      backgroundColor: darkTone ? "#FFFFFF" : "#111827",
      borderColor: darkTone ? "#FFFFFF" : "#111827",
      borderWidth: 0,
      detailColor: darkTone ? "rgba(17,24,39,0.72)" : "rgba(255,255,255,0.72)",
      iconTint: darkTone ? "#111827" : "#FFFFFF",
      textColor: darkTone ? "#111827" : "#FFFFFF",
      useGlass: false,
    }
  }

  if (variant === "destructive") {
    return {
      ...base,
      backgroundColor: darkTone ? "rgba(255,255,255,0.06)" : "#F3F4F6",
      borderColor: darkTone ? "rgba(248,113,113,0.28)" : "rgba(153,27,27,0.14)",
      borderWidth: 1,
      detailColor: darkTone ? "#FCA5A5" : "#B91C1C",
      iconTint: darkTone ? "#FCA5A5" : "#B91C1C",
      textColor: darkTone ? "#FCA5A5" : "#991B1B",
      useGlass: false,
    }
  }

  if (variant === "chip") {
    if (selected) {
      return {
        ...base,
        backgroundColor: darkTone ? "#FFFFFF" : "#111827",
        borderColor: darkTone ? "#FFFFFF" : "#111827",
        borderWidth: 0,
        detailColor: darkTone ? "rgba(17,24,39,0.72)" : "rgba(255,255,255,0.72)",
        iconTint: darkTone ? "#111827" : "#FFFFFF",
        textColor: darkTone ? "#111827" : "#FFFFFF",
        useGlass: false,
      }
    }

    return {
      ...base,
      backgroundColor: darkTone ? "#2C2C2E" : "#F3F4F6",
      borderColor: darkTone ? "rgba(255,255,255,0.08)" : "rgba(17,24,39,0.08)",
      borderWidth: 0,
      detailColor: darkTone ? "#8E8E93" : "#6B7280",
      iconTint: darkTone ? "#FFFFFF" : "#111827",
      textColor: darkTone ? "#FFFFFF" : "#111827",
      useGlass: false,
    }
  }

  if (variant === "glass") {
    return {
      ...base,
      backgroundColor: "transparent",
      borderColor: darkTone ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.24)",
      borderWidth: 1,
      detailColor: darkTone ? "#A1A1AA" : "#6B7280",
      iconTint: darkTone ? "#FFFFFF" : "#111827",
      textColor: darkTone ? "#FFFFFF" : "#111827",
      useGlass: true,
    }
  }

  return {
    ...base,
    backgroundColor: darkTone ? "#2C2C2E" : "#E5E7EB",
    borderColor: "transparent",
    borderWidth: 0,
    detailColor: darkTone ? "#A1A1AA" : "#6B7280",
    iconTint: darkTone ? "#FFFFFF" : "#111827",
    textColor: darkTone ? "#FFFFFF" : "#111827",
    useGlass: false,
  }
}
