import path from "path"

import { config as loadEnv } from "dotenv"
import type { ExpoConfig } from "expo/config"

loadEnv({ path: path.resolve(__dirname, "../../.env.local") })

const config: ExpoConfig = {
  name: "analytics",
  slug: "analytics-native",
  scheme: "analytics",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  icon: "./assets/icon.png",
  ios: {
    bundleIdentifier: "studio.vannputhika.analytics",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false
    }
  },
  android: {
    package: "studio.vannputhika.analytics",
    adaptiveIcon: {
      foregroundImage: "./assets/icon.png",
      backgroundColor: "#FFFFFF",
    },
  },
  web: {
    output: "server",
  },
  plugins: ["expo-router", "expo-image", "expo-secure-store"],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      "projectId": "79781e14-865b-46f3-b2d2-7544ae0e9e0f"
    },
    expoPublicSupabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? null,
    expoPublicSupabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? null,
    expoPublicApiUrl:
      process.env.EXPO_PUBLIC_API_URL ??
      process.env.EXPO_PUBLIC_API_BASE_URL ??
      process.env.EXPO_PUBLIC_APP_URL ??
      null,
  },
}

export default config
