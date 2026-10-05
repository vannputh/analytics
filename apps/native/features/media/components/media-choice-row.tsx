import { View } from "react-native"

import { MediaButton } from "@/features/media/media-button"

export function MediaChoiceRow({
  onSelect,
  options,
  value,
}: {
  onSelect(value: string): void
  options: readonly string[]
  value: string | null | undefined
}) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
      {options.map((option) => {
        const active = value === option

        return (
          <MediaButton
            key={option}
            label={option}
            onPress={() => onSelect(option)}
            selected={active}
            size="compact"
            variant="chip"
          />
        )
      })}
    </View>
  )
}
