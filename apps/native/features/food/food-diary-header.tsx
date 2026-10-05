import { Platform, Pressable } from "react-native"

import { router, Stack } from "expo-router"

import { useFoodDiary } from "@/features/food/food-diary-provider"
import { formatMonthYear } from "@/features/food/food-ui"
import { MEDIA_PRIMARY_TINT } from "@/features/media/media-ui"
import { Symbol } from "@/components/symbol"
import { createMediaAppStoreHeaderOptions } from "@/features/media/media-app-store-header"

function HeaderAddButton() {
  const { selectedDate } = useFoodDiary()

  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={10}
      onPress={() =>
        router.push({
          pathname: "/food/add",
          params: selectedDate ? { date: selectedDate } : undefined,
        })
      }
      style={{
        width: 34,
        height: 34,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Symbol name="plus.circle.fill" size={22} tintColor={MEDIA_PRIMARY_TINT} />
    </Pressable>
  )
}

export function FoodDiaryHeader() {
  const { currentMonth, currentYear, goToNextMonth, goToPreviousMonth, goToToday, selectedDate } =
    useFoodDiary()
  const title = formatMonthYear(currentYear, currentMonth)

  function openAdd() {
    router.push({
      pathname: "/food/add",
      params: selectedDate ? { date: selectedDate } : undefined,
    })
  }

  if (Platform.OS !== "ios") {
    return (
      <Stack.Screen
        options={createMediaAppStoreHeaderOptions({
          title,
          headerLargeTitle: true,
          headerRight: () => <HeaderAddButton />,
        })}
      />
    )
  }

  return (
    <>
      <Stack.Screen options={createMediaAppStoreHeaderOptions({})} />
      <Stack.Screen.Title large largeStyle={{ color: "#111111", fontSize: 34, fontWeight: "800" }}>
        {title}
      </Stack.Screen.Title>
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button
          accessibilityLabel="Previous month"
          icon="chevron.left"
          onPress={goToPreviousMonth}
        />
        <Stack.Toolbar.Button
          accessibilityLabel="Next month"
          icon="chevron.right"
          onPress={goToNextMonth}
        />
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button accessibilityLabel="Go to today" onPress={goToToday}>
          Today
        </Stack.Toolbar.Button>
        <Stack.Toolbar.Button accessibilityLabel="Add food entry" icon="plus" onPress={openAdd} />
      </Stack.Toolbar>
    </>
  )
}
