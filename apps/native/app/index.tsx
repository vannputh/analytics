import { Redirect } from "expo-router"

import { useAuth } from "@/components/auth-provider"
import { AuthStartupScreen } from "@/features/auth/auth-startup-screen"

export default function IndexRoute() {
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

  if (configurationError) {
    return (
      <AuthStartupScreen
        title="Native setup required"
        detail="This app now starts in Expo first. Configure the Expo public Supabase and API variables before continuing."
      />
    )
  }

  return <Redirect href={isApproved ? "/media" : "/login"} />
}
