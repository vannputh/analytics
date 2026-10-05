import { Platform } from "react-native"

import type { NativeStackNavigationOptions } from "@react-navigation/native-stack"

import { MEDIA_PRIMARY_TINT } from "@/features/media/media-ui"

export function createMediaAppStoreHeaderOptions(
  options: Pick<
    NativeStackNavigationOptions,
    "title" | "headerLargeTitle" | "headerSearchBarOptions" | "headerRight"
  >,
): NativeStackNavigationOptions {
  if (Platform.OS !== "ios") {
    return {
      ...options,
      headerShadowVisible: false,
      headerTintColor: MEDIA_PRIMARY_TINT,
      headerTitleStyle: {
        color: MEDIA_PRIMARY_TINT,
        fontWeight: "700",
      },
    }
  }

  return {
    ...options,
    headerTransparent: true,
    headerShadowVisible: false,
    headerTintColor: MEDIA_PRIMARY_TINT,
    headerLargeStyle: {
      backgroundColor: "transparent",
    },
    headerLargeTitleStyle: {
      color: MEDIA_PRIMARY_TINT,
      fontSize: 34,
      fontWeight: "800",
    },
    headerStyle: {
      backgroundColor: "transparent",
    },
    headerTitleStyle: {
      color: MEDIA_PRIMARY_TINT,
      fontWeight: "700",
    },
  }
}
