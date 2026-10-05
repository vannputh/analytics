import { Redirect } from "expo-router"
import * as Haptics from "expo-haptics"
import { useEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  Keyboard,
  type KeyboardEvent,
  Pressable,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { useAuth } from "@/components/auth-provider"
import { AuthScreenShell } from "@/features/auth/auth-screen-shell"
import { AuthStartupScreen } from "@/features/auth/auth-startup-screen"
import { AuthStatusCard } from "@/features/auth/auth-status-card"

export default function LoginScreen() {
  const {
    authMessage,
    authStatus,
    configurationError,
    hasRequiredConfig,
    initialized,
    isApproved,
    requestOtp,
    resendOtp,
    resetAuthFlow,
    verifyOtp,
  } = useAuth()
  const { height: windowHeight } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const otpInputRef = useRef<TextInput | null>(null)
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("")
  const [keyboardInset, setKeyboardInset] = useState(0)
  const [otpCode, setOtpCode] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const awaitingCode = authStatus === "awaiting_code"
  const keyboardVisible = keyboardInset > 0

  useEffect(() => {
    function getKeyboardInset(event: KeyboardEvent) {
      const frameInset = Math.max(windowHeight - event.endCoordinates.screenY, 0)
      const heightInset = Math.max(event.endCoordinates.height - insets.bottom, 0)
      return Math.max(frameInset - insets.bottom, heightInset)
    }

    function handleKeyboardFrameChange(event: KeyboardEvent) {
      if (process.env.EXPO_OS === "ios") {
        Keyboard.scheduleLayoutAnimation(event)
      }

      setKeyboardInset(getKeyboardInset(event))
    }

    function handleKeyboardHide(event?: KeyboardEvent) {
      if (process.env.EXPO_OS === "ios" && event) {
        Keyboard.scheduleLayoutAnimation(event)
      }

      setKeyboardInset(0)
    }

    if (process.env.EXPO_OS === "ios") {
      const frameSubscription = Keyboard.addListener("keyboardWillChangeFrame", handleKeyboardFrameChange)
      const hideSubscription = Keyboard.addListener("keyboardWillHide", handleKeyboardHide)

      return () => {
        frameSubscription.remove()
        hideSubscription.remove()
      }
    }

    const showSubscription = Keyboard.addListener("keyboardDidShow", handleKeyboardFrameChange)
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      handleKeyboardHide()
    })

    return () => {
      showSubscription.remove()
      hideSubscription.remove()
    }
  }, [insets.bottom, windowHeight])

  useEffect(() => {
    if (!awaitingCode) {
      return
    }

    const focusTimeout = setTimeout(() => {
      otpInputRef.current?.focus()
    }, 120)

    return () => {
      clearTimeout(focusTimeout)
    }
  }, [awaitingCode])

  if (!initialized) {
    return (
      <AuthStartupScreen
        loading
        title="Opening your diary"
        detail="Preparing your account, restoring your session, and checking approval before the app loads."
      />
    )
  }

  if (isApproved) {
    return <Redirect href="/media" />
  }

  async function handleSendCode() {
    try {
      setSubmitting(true)
      await requestOtp(email, mode)
      setOtpCode("")
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleVerifyCode() {
    try {
      setSubmitting(true)
      await verifyOtp(email, otpCode, mode)
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

      if (mode === "signup") {
        setMode("login")
        setOtpCode("")
      }
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResendCode() {
    try {
      setSubmitting(true)
      await resendOtp()
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    } finally {
      setSubmitting(false)
    }
  }

  function handleModeChange(nextMode: "login" | "signup") {
    Keyboard.dismiss()
    setMode(nextMode)
    setOtpCode("")
    resetAuthFlow()
  }

  function handleDismissKeyboard() {
    Keyboard.dismiss()
  }

  function handleEmailSubmit() {
    if (!email.trim() || submitting || !hasRequiredConfig) {
      handleDismissKeyboard()
      return
    }

    void handleSendCode()
  }

  function handleOtpSubmit() {
    if (otpCode.trim().length < 6 || submitting || !hasRequiredConfig) {
      handleDismissKeyboard()
      return
    }

    void handleVerifyCode()
  }

  const isSignupMode = mode === "signup"
  const hasEmail = email.trim().length > 0
  const secondaryPrompt = isSignupMode
    ? {
        action: "Sign in",
        lead: "Already have access?",
        nextMode: "login" as const,
      }
    : {
        action: "Request access",
        lead: "Don't have access?",
        nextMode: "signup" as const,
      }
  const showAuthMessage = !awaitingCode && authMessage
  const screenTitle = awaitingCode ? "enter your code" : isSignupMode ? "request access" : "sign in"
  const screenDetail = awaitingCode
    ? `Enter the code sent to ${email.trim() || "your email"}.`
    : isSignupMode
      ? "Verify your email to get access."
      : "Use your email to get your OTP."

  return (
    <TouchableWithoutFeedback onPress={handleDismissKeyboard} accessible={false}>
      <View style={{ flex: 1, backgroundColor: "#000000" }}>
        <AuthScreenShell title={screenTitle} detail={screenDetail} keyboardInset={keyboardInset}>
          {({ compact, contentGap, dense, inputPaddingVertical, sectionGap }) => {
            const helperTextStyle = {
              fontSize: dense ? 12 : 13,
              lineHeight: dense ? 18 : 19,
              color: "#71717A",
            } as const
            const stackGap = keyboardVisible ? (dense ? 14 : 16) : dense ? 16 : 18
            const actionGap = dense ? 8 : 10

            return (
              <View
                style={{
                  flex: 1,
                  minHeight: 0,
                  justifyContent: "flex-start",
                  gap: stackGap,
                  paddingTop: keyboardVisible ? 0 : dense ? 0 : 2,
                }}
              >
                <View style={{ gap: keyboardVisible ? sectionGap : contentGap }}>
                  {configurationError ? (
                    <AuthStatusCard
                      notice={{
                        detail: `${configurationError} Restart Expo after setting the missing variables.`,
                        title: "Configuration required",
                        tone: "error",
                      }}
                    />
                  ) : null}

                  {showAuthMessage ? <AuthStatusCard notice={showAuthMessage} /> : null}

                  {!awaitingCode ? (
                    <View style={{ gap: dense ? 6 : 8 }}>
                      <Text selectable style={{ fontSize: 14, fontWeight: "700", color: "#111111" }}>
                        Email *
                      </Text>
                      <TextInput
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="email"
                        keyboardType="email-address"
                        placeholder="you@example.com"
                        placeholderTextColor="#71717A"
                        returnKeyType="done"
                        submitBehavior="submit"
                        value={email}
                        onChangeText={setEmail}
                        onSubmitEditing={handleEmailSubmit}
                        style={{
                          borderRadius: 18,
                          borderCurve: "continuous",
                          borderWidth: 1,
                          borderColor: "#D4D4D8",
                          backgroundColor: "#FFFFFF",
                          paddingHorizontal: 16,
                          paddingVertical: inputPaddingVertical,
                          fontSize: 16,
                          color: "#111111",
                        }}
                      />
                      <Text selectable style={helperTextStyle}>
                        {isSignupMode
                          ? "New requests stay pending until an administrator approves them."
                          : "Only approved accounts can receive a sign-in code."}
                      </Text>
                    </View>
                  ) : (
                    <View style={{ gap: dense ? 6 : 8 }}>
                      <Text selectable style={{ fontSize: 14, fontWeight: "700", color: "#111111" }}>
                        Verification code
                      </Text>
                      <TextInput
                        ref={otpInputRef}
                        autoComplete="one-time-code"
                        keyboardType="number-pad"
                        placeholder="123456"
                        placeholderTextColor="#71717A"
                        returnKeyType="done"
                        submitBehavior="submit"
                        value={otpCode}
                        onChangeText={(value) => setOtpCode(value.replace(/\D/g, ""))}
                        onSubmitEditing={handleOtpSubmit}
                        style={{
                          borderRadius: 18,
                          borderCurve: "continuous",
                          borderWidth: 1,
                          borderColor: "#D4D4D8",
                          backgroundColor: "#FFFFFF",
                          paddingHorizontal: 16,
                          paddingVertical: inputPaddingVertical,
                          fontSize: dense ? 18 : 20,
                          letterSpacing: compact ? 3 : 4,
                          textAlign: "center",
                          color: "#111111",
                          fontVariant: ["tabular-nums"],
                        }}
                      />
                      <Text selectable style={helperTextStyle}>
                        Codes arrive by email only.
                      </Text>
                    </View>
                  )}
                </View>

                <View
                  style={{
                    gap: actionGap,
                    paddingTop: keyboardVisible ? 0 : dense ? 0 : 2,
                  }}
                >
                  {!awaitingCode ? (
                    <>
                      <Pressable
                        onPress={handleSendCode}
                        disabled={submitting || !hasRequiredConfig || !hasEmail}
                        style={{
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: 18,
                          borderCurve: "continuous",
                          paddingVertical: dense ? 15 : 16,
                          backgroundColor: "#111111",
                          opacity: submitting || !hasRequiredConfig || !hasEmail ? 0.5 : 1,
                        }}
                      >
                        {submitting ? (
                          <ActivityIndicator color="#FFFFFF" />
                        ) : (
                          <Text selectable style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}>
                            {isSignupMode ? "Continue" : "Send Code"}
                          </Text>
                        )}
                      </Pressable>

                      <Pressable
                        onPress={() => handleModeChange(secondaryPrompt.nextMode)}
                        disabled={submitting}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          opacity: submitting ? 0.5 : 1,
                        }}
                      >
                        <Text selectable style={{ fontSize: 14, lineHeight: 20, color: "#71717A" }}>
                          {secondaryPrompt.lead}
                        </Text>
                        <Text
                          selectable
                          style={{ fontSize: 14, lineHeight: 20, fontWeight: "700", color: "#111111" }}
                        >
                          {secondaryPrompt.action}
                        </Text>
                      </Pressable>
                    </>
                  ) : (
                    <>
                      <Pressable
                        onPress={handleVerifyCode}
                        disabled={submitting || !hasRequiredConfig || otpCode.trim().length < 6}
                        style={{
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: 18,
                          borderCurve: "continuous",
                          paddingVertical: dense ? 15 : 16,
                          backgroundColor: "#111111",
                          opacity: submitting || !hasRequiredConfig || otpCode.trim().length < 6 ? 0.5 : 1,
                        }}
                      >
                        {submitting ? (
                          <ActivityIndicator color="#FFFFFF" />
                        ) : (
                          <Text selectable style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}>
                            {isSignupMode ? "Verify and Request Access" : "Verify and Sign In"}
                          </Text>
                        )}
                      </Pressable>

                      <Pressable
                        onPress={handleResendCode}
                        disabled={submitting || !hasRequiredConfig}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          opacity: submitting || !hasRequiredConfig ? 0.5 : 1,
                        }}
                      >
                        <Text selectable style={{ fontSize: 14, lineHeight: 20, color: "#71717A" }}>
                          Didn&apos;t get a code?
                        </Text>
                        <Text
                          selectable
                          style={{ fontSize: 14, lineHeight: 20, fontWeight: "700", color: "#111111" }}
                        >
                          Resend
                        </Text>
                      </Pressable>
                    </>
                  )}
                </View>
              </View>
            )
          }}
        </AuthScreenShell>
      </View>
    </TouchableWithoutFeedback>
  )
}
