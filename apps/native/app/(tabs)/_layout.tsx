import { Redirect } from "expo-router"
import { NativeTabs } from "expo-router/unstable-native-tabs"

import { APP_TAB_BAR_TINT, APP_TAB_ITEMS } from "@/components/app-tab-bar-theme"
import { useAuth } from "@/components/auth-provider"
import { AuthStartupScreen } from "@/features/auth/auth-startup-screen"
import { MediaDiaryProvider } from "@/features/media/media-diary-provider"

export default function TabLayout() {
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
      <NativeTabs minimizeBehavior="onScrollDown" tintColor={APP_TAB_BAR_TINT}>
        <NativeTabs.Trigger name="media">
          <NativeTabs.Trigger.Label>{APP_TAB_ITEMS.media.title}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon md={APP_TAB_ITEMS.media.md} sf={APP_TAB_ITEMS.media.sf} />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="food">
          <NativeTabs.Trigger.Label>{APP_TAB_ITEMS.food.title}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon md={APP_TAB_ITEMS.food.md} sf={APP_TAB_ITEMS.food.sf} />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="insights">
          <NativeTabs.Trigger.Label>{APP_TAB_ITEMS.insights.title}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon md={APP_TAB_ITEMS.insights.md} sf={APP_TAB_ITEMS.insights.sf} />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="profile">
          <NativeTabs.Trigger.Label>{APP_TAB_ITEMS.profile.title}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon md={APP_TAB_ITEMS.profile.md} sf={APP_TAB_ITEMS.profile.sf} />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="search" role="search">
          <NativeTabs.Trigger.Label>{APP_TAB_ITEMS.search.title}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon md={APP_TAB_ITEMS.search.md} sf={APP_TAB_ITEMS.search.sf} />
        </NativeTabs.Trigger>
      </NativeTabs>
    </MediaDiaryProvider>
  )
}
