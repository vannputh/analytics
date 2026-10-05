import { Alert, PlatformColor, Text, View } from "react-native"

import * as Haptics from "expo-haptics"

import { useAuth } from "@/components/auth-provider"
import { ProfileActionsSection } from "@/features/auth/profile-actions-section"
import { ProfileListRow } from "@/features/auth/profile-list-row"
import { ProfileOverviewCard } from "@/features/auth/profile-overview-card"
import { MediaScreenScrollView } from "@/features/media/primitives/media-screen-scroll-view"
import { MediaSurface } from "@/features/media/media-surface"

function formatLabel(value: string | null | undefined, fallback: string) {
  if (!value) {
    return fallback
  }

  return value.charAt(0).toUpperCase() + value.slice(1)
}

function getAccountDetail(status: string | null | undefined) {
  switch (status) {
    case "approved":
      return "Your account is approved and ready across the native workspace."
    case "pending":
      return "Your access request is still pending review."
    case "rejected":
      return "This account no longer has access. Contact the admin team if that looks wrong."
    default:
      return "Your session is active on this device."
  }
}

export function NativeProfileScreen() {
  const { profile, signOut, user } = useAuth()
  const email = user?.email ?? profile?.email ?? "Unknown"
  const statusLabel = formatLabel(profile?.status, "Unknown")
  const roleLabel = profile?.is_admin ? "Admin" : "Member"
  const accountDetail = getAccountDetail(profile?.status)

  async function handleSignOut() {
    try {
      await Haptics.selectionAsync()
      await signOut()
    } catch (error) {
      Alert.alert("Unable to sign out", error instanceof Error ? error.message : "Unknown error")
    }
  }

  return (
    <MediaScreenScrollView style={{ backgroundColor: PlatformColor("systemGroupedBackground") }}>
      <ProfileOverviewCard detail={accountDetail} email={email} statusLabel={statusLabel} />

      <MediaSurface style={{ gap: 2 }}>
        <View style={{ gap: 4, paddingBottom: 2 }}>
          <Text selectable style={{ fontSize: 13, fontWeight: "700", color: PlatformColor("secondaryLabel") }}>
            Account
          </Text>
          <Text selectable style={{ fontSize: 14, lineHeight: 20, color: PlatformColor("secondaryLabel") }}>
            Identity and access details for the account currently signed in on this device.
          </Text>
        </View>

        <ProfileListRow icon="envelope.fill" label="Email" value={email} />
        <ProfileListRow icon="checkmark.seal.fill" label="Status" value={statusLabel} />
        <ProfileListRow
          icon="person.badge.shield.checkmark.fill"
          isLast
          label="Role"
          value={roleLabel}
        />
      </MediaSurface>

      <ProfileActionsSection
        detail="Signing out only removes this local session. Your account access and diary data stay the same."
        onSignOut={() => {
          void handleSignOut()
        }}
      />
    </MediaScreenScrollView>
  )
}
