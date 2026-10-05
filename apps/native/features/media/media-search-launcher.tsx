import { Pressable } from "react-native"

import { router } from "expo-router"

import { Symbol } from "@/components/symbol"
import { MEDIA_PRIMARY_TINT } from "@/features/media/media-ui"

export function MediaAddHeaderButton() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Add media entry"
      hitSlop={10}
      onPress={() => router.push("/media/add")}
      style={{
        width: 34,
        height: 34,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Symbol name="plus" size={22} tintColor={MEDIA_PRIMARY_TINT} />
    </Pressable>
  )
}
