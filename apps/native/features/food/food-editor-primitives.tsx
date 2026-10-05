import type { ReactNode } from "react"
import { Text, View } from "react-native"

import { MediaButton } from "@/features/media/media-button"
import { MEDIA_PRIMARY_TINT_MUTED } from "@/features/media/media-ui"

export function FoodField({
  children,
  description,
  label,
}: {
  children: ReactNode
  description?: string
  label: string
}) {
  return (
    <View style={{ gap: 8 }}>
      <View style={{ gap: 2 }}>
        <Text selectable style={{ fontSize: 13, fontWeight: "700", color: MEDIA_PRIMARY_TINT_MUTED }}>
          {label}
        </Text>
        {description ? (
          <Text selectable style={{ fontSize: 12, lineHeight: 18, color: MEDIA_PRIMARY_TINT_MUTED }}>
            {description}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  )
}

export function FoodChoiceRow({
  onSelect,
  options,
  selectedValues,
}: {
  onSelect(value: string): void
  options: readonly string[]
  selectedValues: string[]
}) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
      {options.map((option) => (
        <MediaButton
          key={option}
          label={option}
          onPress={() => onSelect(option)}
          selected={selectedValues.includes(option)}
          size="compact"
          variant="chip"
        />
      ))}
    </View>
  )
}

export function FoodRatingSelector({
  label,
  onChange,
  value,
}: {
  label: string
  onChange(value: number | null): void
  value: number | null
}) {
  return (
    <FoodField label={label}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {[1, 2, 3, 4, 5].map((option) => (
          <MediaButton
            key={option}
            label={String(option)}
            onPress={() => onChange(value === option ? null : option)}
            selected={value === option}
            size="compact"
            variant="chip"
          />
        ))}
      </View>
    </FoodField>
  )
}
