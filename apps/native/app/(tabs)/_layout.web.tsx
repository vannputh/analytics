import Ionicons from "@expo/vector-icons/Ionicons"
import { Redirect, Tabs } from "expo-router"

import { APP_TAB_BAR_TINT, APP_TAB_ITEMS } from "@/components/app-tab-bar-theme"
import { useAuth } from "@/components/auth-provider"
import { AuthStartupScreen } from "@/features/auth/auth-startup-screen"
import { MediaDiaryProvider } from "@/features/media/media-diary-provider"

function renderTabBarIcon(
  icon: (typeof APP_TAB_ITEMS)[keyof typeof APP_TAB_ITEMS]["webIcon"],
  color: string,
  size: number,
  focused: boolean,
) {
  return <Ionicons color={color} name={focused ? icon.selected : icon.default} size={size} />
}

export default function WebTabLayout() {
  const { configurationError, initialized, isApproved } = useAuth()

  if (!initialized) {
    return (
      <AuthStartupScreen
        loading
        title="Opening your diary"
        detail="Preparing your account, restoring your session, and checking approval before the app loads."
      />
    )
  }

  if (configurationError || !isApproved) {
    return <Redirect href="/login" />
  }

  return (
    <MediaDiaryProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: APP_TAB_BAR_TINT,
        }}
      >
        <Tabs.Screen
          name="media"
          options={{
            title: APP_TAB_ITEMS.media.title,
            tabBarIcon: ({ color, focused, size }) =>
              renderTabBarIcon(APP_TAB_ITEMS.media.webIcon, color, size, focused),
          }}
        />
        <Tabs.Screen
          name="food"
          options={{
            title: APP_TAB_ITEMS.food.title,
            tabBarIcon: ({ color, focused, size }) =>
              renderTabBarIcon(APP_TAB_ITEMS.food.webIcon, color, size, focused),
          }}
        />
        <Tabs.Screen
          name="insights"
          options={{
            title: APP_TAB_ITEMS.insights.title,
            tabBarIcon: ({ color, focused, size }) =>
              renderTabBarIcon(APP_TAB_ITEMS.insights.webIcon, color, size, focused),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: APP_TAB_ITEMS.profile.title,
            tabBarIcon: ({ color, focused, size }) =>
              renderTabBarIcon(APP_TAB_ITEMS.profile.webIcon, color, size, focused),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: APP_TAB_ITEMS.search.title,
            tabBarIcon: ({ color, focused, size }) =>
              renderTabBarIcon(APP_TAB_ITEMS.search.webIcon, color, size, focused),
          }}
        />
      </Tabs>
    </MediaDiaryProvider>
  )
}
