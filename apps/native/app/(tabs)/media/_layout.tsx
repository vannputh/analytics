import { Stack } from "expo-router"

export default function MediaLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="add"
        options={{
          title: "Add Entry",
          presentation: "formSheet",
        }}
      />
      <Stack.Screen
        name="filters"
        options={{
          title: "Filters",
          presentation: "formSheet",
        }}
      />
      <Stack.Screen
        name="filters/[group]"
        options={{
          title: "Filter",
        }}
      />
      <Stack.Screen
        name="display-preferences"
        options={{
          title: "Display",
          presentation: "formSheet",
        }}
      />
      <Stack.Screen
        name="watch-this"
        options={{
          title: "Watch This",
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
  )
}
