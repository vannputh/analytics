import { Stack } from "expo-router"

import { FoodDiaryProvider } from "@/features/food/food-diary-provider"
import { createMediaAppStoreHeaderOptions } from "@/features/media/media-app-store-header"

export default function FoodLayout() {
  return (
    <FoodDiaryProvider>
      <Stack>
        <Stack.Screen
          name="index"
          options={createMediaAppStoreHeaderOptions({
            title: "Food",
            headerLargeTitle: true,
          })}
        />
        <Stack.Screen
          name="add"
          options={{
            title: "Add Entry",
            presentation: "formSheet",
          }}
        />
        <Stack.Screen
          name="entry/[id]"
          options={{
            title: "Entry",
          }}
        />
        <Stack.Screen
          name="entry/[id]/edit"
          options={{
            title: "Edit Entry",
            presentation: "formSheet",
          }}
        />
      </Stack>
    </FoodDiaryProvider>
  )
}
