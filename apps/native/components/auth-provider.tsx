import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"

import type { Session, User } from "@supabase/supabase-js"

import type { UserProfile } from "@analytics/domain"
import {
  createUserProfileRepository,
  resolveUserProfileAuthState,
  type UserProfileAuthState,
} from "@analytics/data"

import type { AuthMode, AuthStatus, AuthStatusNotice } from "@/features/auth/auth-types"
import { buildApiUrl } from "@/lib/api"
import { getNativeConfigurationError, hasApiBaseUrl, hasPublicSupabaseConfig } from "@/lib/config"
import { supabase } from "@/lib/supabase"

interface CheckUserResponse {
  approved?: boolean
  exists: boolean
  status?: string
}

const AUTH_REQUEST_TIMEOUT_MS = 12000
const APP_REVIEWER_EMAIL = "appreviewer@test.com"
const APP_REVIEWER_CODE = "123456"

interface AuthContextValue {
  authMessage: AuthStatusNotice | null
  authStatus: AuthStatus
  configurationError: string | null
  hasRequiredConfig: boolean
  initialized: boolean
  isAdmin: boolean
  isApproved: boolean
  isAuthenticated: boolean
  profile: UserProfile | null
  resendOtp(): Promise<void>
  requestOtp(email: string, mode: AuthMode): Promise<void>
  resetAuthFlow(): void
  session: Session | null
  signOut(): Promise<void>
  user: User | null
  verifyOtp(email: string, otpCode: string, mode: AuthMode): Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function createNotice(
  tone: AuthStatusNotice["tone"],
  title: string,
  detail: string,
): AuthStatusNotice {
  return { detail, title, tone }
}

function getConfigurationNotice(configurationError: string | null) {
  return createNotice(
    "error",
    "Native configuration required",
    configurationError ?? "The Expo public Supabase and API variables are incomplete.",
  )
}

function getBlockedNotice(state: UserProfileAuthState): AuthStatusNotice {
  if (state === "pending") {
    return createNotice(
      "warning",
      "Approval pending",
      "Your access request is still waiting for admin approval. You can sign in after approval is granted.",
    )
  }

  if (state === "rejected") {
    return createNotice(
      "error",
      "Access request rejected",
      "This account is not approved to use the app. Contact the administrator if you need access.",
    )
  }

  return createNotice(
    "error",
    "Profile not found",
    "We could not match this session to a valid user profile. Request access again or contact the administrator.",
  )
}

function getOtpSentNotice(mode: AuthMode, email: string): AuthStatusNotice {
  return createNotice(
    "info",
    mode === "signup" ? "Verification code sent" : "Sign-in code sent",
    mode === "signup"
      ? `Enter the code we sent to ${email} to finish your access request.`
      : `Enter the code we sent to ${email} to sign in on this device.`,
  )
}

function getPendingSignupNotice(email: string): AuthStatusNotice {
  return createNotice(
    "success",
    "Request submitted",
    `Your request for ${email} is now pending approval. You can sign in after an administrator approves it.`,
  )
}

function getReviewerCodeNotice(email: string): AuthStatusNotice {
  return createNotice(
    "info",
    "Reviewer code ready",
    `Enter the App Review code for ${email} to sign in on this device.`,
  )
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function isAppReviewerLogin(email: string, mode: AuthMode) {
  return mode === "login" && normalizeEmail(email) === APP_REVIEWER_EMAIL
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}

async function fetchWithTimeout(
  input: Parameters<typeof fetch>[0],
  init?: Parameters<typeof fetch>[1],
  timeoutMs = AUTH_REQUEST_TIMEOUT_MS,
) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeoutId)
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const configurationError = getNativeConfigurationError()
  const hasRequiredConfig = hasPublicSupabaseConfig() && hasApiBaseUrl()
  const profileRepository = useMemo(() => (supabase ? createUserProfileRepository(supabase) : null), [])
  const pendingSignedOutStateRef = useRef<{
    notice: AuthStatusNotice | null
    status: AuthStatus
  } | null>(null)

  const [authMessage, setAuthMessage] = useState<AuthStatusNotice | null>(
    hasRequiredConfig ? null : getConfigurationNotice(configurationError),
  )
  const [authStatus, setAuthStatus] = useState<AuthStatus>(hasRequiredConfig ? "initializing" : "error")
  const [initialized, setInitialized] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [activeFlow, setActiveFlow] = useState<{ email: string; mode: AuthMode } | null>(null)

  const handleSignedOutState = useCallback(() => {
    setSession(null)
    setProfile(null)

    const preservedState = pendingSignedOutStateRef.current
    pendingSignedOutStateRef.current = null

    if (preservedState) {
      setAuthStatus(preservedState.status)
      setAuthMessage(preservedState.notice)
    } else if (!hasRequiredConfig) {
      setAuthStatus("error")
      setAuthMessage(getConfigurationNotice(configurationError))
    } else {
      setAuthStatus("signed_out")
      setAuthMessage(null)
    }

    setInitialized(true)
  }, [configurationError, hasRequiredConfig])

  const applyApprovedSession = useCallback(
    async (nextSession: Session) => {
      if (!profileRepository || !supabase) {
        pendingSignedOutStateRef.current = {
          notice: getConfigurationNotice(configurationError),
          status: "error",
        }
        await supabase?.auth.signOut()
        return false
      }

      setSession(nextSession)

      try {
        const nextProfile = await profileRepository.getCurrentProfile(nextSession.user.id)
        const nextState = resolveUserProfileAuthState(nextProfile)

        if (nextState === "approved" && nextProfile) {
          setProfile(nextProfile)
          setAuthStatus("approved")
          setAuthMessage(null)
          setActiveFlow(null)
          setInitialized(true)
          return true
        }

        pendingSignedOutStateRef.current = {
          notice: getBlockedNotice(nextState),
          status: nextState === "missing" ? "error" : nextState,
        }
        await supabase.auth.signOut()
        return false
      } catch (error) {
        pendingSignedOutStateRef.current = {
          notice: createNotice(
            "error",
            "Unable to restore your account",
            error instanceof Error ? error.message : "Unknown error",
          ),
          status: "error",
        }
        await supabase.auth.signOut()
        return false
      }
    },
    [configurationError, profileRepository],
  )

  useEffect(() => {
    if (!supabase || !hasRequiredConfig) {
      handleSignedOutState()
      return
    }

    const nativeSupabase = supabase
    let mounted = true

    async function bootstrap() {
      const {
        data: { session: nextSession },
      } = await nativeSupabase.auth.getSession()

      if (!mounted) {
        return
      }

      if (!nextSession) {
        handleSignedOutState()
        return
      }

      await applyApprovedSession(nextSession)
      if (mounted) {
        setInitialized(true)
      }
    }

    void bootstrap()

    const { data: subscription } = nativeSupabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!nextSession) {
        handleSignedOutState()
        return
      }

      void applyApprovedSession(nextSession)
    })

    return () => {
      mounted = false
      subscription.subscription.unsubscribe()
    }
  }, [applyApprovedSession, handleSignedOutState, hasRequiredConfig])

  const fetchApprovalStatus = useCallback(async (email: string) => {
    try {
      const response = await fetchWithTimeout(buildApiUrl("/api/auth/check-user"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const result = (await response.json().catch(() => null)) as CheckUserResponse | { error?: string } | null

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(
            "The auth approval endpoint is unavailable. Confirm the Expo API server is running and EXPO_PUBLIC_API_URL points to it.",
          )
        }

        throw new Error(
          result && typeof result === "object" && "error" in result && result.error
            ? result.error
            : "Failed to verify account status.",
        )
      }

      return result as CheckUserResponse
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(
          "The auth approval request timed out. Confirm the Expo API server is running at EXPO_PUBLIC_API_URL and that /api/auth/check-user responds.",
        )
      }

      throw new Error(
        getErrorMessage(
          error,
          "Unable to reach the auth approval service. Confirm your API URL and network connection.",
        ),
      )
    }
  }, [])

  const sendOtp = useCallback(async (email: string, mode: AuthMode) => {
    if (!supabase) {
      throw new Error(getNativeConfigurationError() ?? "Native configuration is incomplete.")
    }

    const sendOtpPromise = supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: mode === "signup",
      },
    })

    const timeoutPromise = new Promise<never>((_, reject) => {
      const timeoutId = setTimeout(() => {
        clearTimeout(timeoutId)
        reject(
          new Error(
            "Supabase did not respond while sending the one-time code. Check your Supabase email auth configuration and try again.",
          ),
        )
      }, AUTH_REQUEST_TIMEOUT_MS)
    })

    const { error } = await Promise.race([sendOtpPromise, timeoutPromise])

    if (error) {
      throw error
    }
  }, [])

  const requestOtp = useCallback(
    async (email: string, mode: AuthMode) => {
      if (!supabase || !hasApiBaseUrl()) {
        const notice = getConfigurationNotice(configurationError)
        setAuthStatus("error")
        setAuthMessage(notice)
        throw new Error(notice.detail)
      }

      const normalizedEmail = normalizeEmail(email)

      if (!normalizedEmail) {
        const notice = createNotice("error", "Email required", "Enter an email address to continue.")
        setAuthMessage(notice)
        setAuthStatus("signed_out")
        throw new Error(notice.detail)
      }

      let existingUser: CheckUserResponse

      try {
        existingUser = await fetchApprovalStatus(normalizedEmail)
      } catch (error) {
        const notice = createNotice(
          "error",
          mode === "signup" ? "Unable to send verification code" : "Unable to send sign-in code",
          getErrorMessage(
            error,
            "Unable to reach the auth approval service. Confirm your API URL and network connection.",
          ),
        )
        setAuthStatus("signed_out")
        setAuthMessage(notice)
        throw error
      }

      if (mode === "signup") {
        if (existingUser.exists) {
          if (existingUser.approved === false) {
            const notice = getBlockedNotice(
              existingUser.status === "rejected" ? "rejected" : "pending",
            )
            setAuthStatus(existingUser.status === "rejected" ? "rejected" : "pending")
            setAuthMessage(notice)
            throw new Error(notice.detail)
          }

          const notice = createNotice(
            "error",
            "Email already registered",
            "This email already has access. Use the Login tab instead.",
          )
          setAuthStatus("signed_out")
          setAuthMessage(notice)
          throw new Error(notice.detail)
        }
      } else {
        if (!existingUser.exists) {
          const notice = createNotice(
            "warning",
            "No account found",
            "This email is not registered yet. Use Request Access to create an approval request.",
          )
          setAuthStatus("signed_out")
          setAuthMessage(notice)
          throw new Error(notice.detail)
        }

        if (existingUser.approved === false) {
          const nextState = existingUser.status === "rejected" ? "rejected" : "pending"
          const notice = getBlockedNotice(nextState)
          setAuthStatus(nextState)
          setAuthMessage(notice)
          throw new Error(notice.detail)
        }
      }

      if (isAppReviewerLogin(normalizedEmail, mode)) {
        setActiveFlow({ email: normalizedEmail, mode })
        setAuthStatus("awaiting_code")
        setAuthMessage(getReviewerCodeNotice(normalizedEmail))
        return
      }

      try {
        await sendOtp(normalizedEmail, mode)
      } catch (error) {
        const notice = createNotice(
          "error",
          mode === "signup" ? "Unable to send verification code" : "Unable to send sign-in code",
          getErrorMessage(error, "We could not send a one-time code right now. Please try again."),
        )
        setAuthStatus("signed_out")
        setAuthMessage(notice)
        throw error
      }

      setActiveFlow({ email: normalizedEmail, mode })
      setAuthStatus("awaiting_code")
      setAuthMessage(getOtpSentNotice(mode, normalizedEmail))
    },
    [configurationError, fetchApprovalStatus, sendOtp],
  )

  const resendOtp = useCallback(async () => {
    if (!activeFlow) {
      const notice = createNotice(
        "error",
        "No code to resend",
        "Start a login or access request first, then you can resend the code.",
      )
      setAuthMessage(notice)
      throw new Error(notice.detail)
    }

    await requestOtp(activeFlow.email, activeFlow.mode)
  }, [activeFlow, requestOtp])

  const verifyOtp = useCallback(
    async (email: string, otpCode: string, mode: AuthMode) => {
      if (!supabase || !profileRepository) {
        const notice = getConfigurationNotice(configurationError)
        setAuthStatus("error")
        setAuthMessage(notice)
        throw new Error(notice.detail)
      }

      const normalizedEmail = normalizeEmail(email)
      const normalizedCode = otpCode.trim()

      if (!normalizedCode) {
        const notice = createNotice(
          "error",
          "Verification code required",
          "Enter the code from your email to continue.",
        )
        setAuthMessage(notice)
        throw new Error(notice.detail)
      }

      if (isAppReviewerLogin(normalizedEmail, mode)) {
        if (normalizedCode !== APP_REVIEWER_CODE) {
          const notice = createNotice("error", "Verification failed", "Invalid reviewer code.")
          setAuthMessage(notice)
          throw new Error(notice.detail)
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: APP_REVIEWER_EMAIL,
          password: APP_REVIEWER_CODE,
        })

        if (error) {
          const notice = createNotice("error", "Verification failed", error.message)
          setAuthMessage(notice)
          throw error
        }

        if (!data.session) {
          const notice = createNotice(
            "error",
            "Session missing",
            "The reviewer code was accepted, but the session could not be restored.",
          )
          setAuthStatus("error")
          setAuthMessage(notice)
          throw new Error(notice.detail)
        }

        const approved = await applyApprovedSession(data.session)
        if (!approved) {
          throw new Error(
            pendingSignedOutStateRef.current?.notice?.detail ??
              "Your account is not approved to use the app.",
          )
        }
        return
      }

      const { error } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: normalizedCode,
        type: "email",
      })

      if (error) {
        const notice = createNotice("error", "Verification failed", error.message)
        setAuthMessage(notice)
        throw error
      }

      if (mode === "signup") {
        const {
          data: { user: nextUser },
        } = await supabase.auth.getUser()

        if (!nextUser?.email) {
          const notice = createNotice(
            "error",
            "Unable to create access request",
            "Supabase did not return a user record after verification.",
          )
          setAuthStatus("error")
          setAuthMessage(notice)
          throw new Error(notice.detail)
        }

        try {
          await profileRepository.createPendingProfile({
            email: nextUser.email,
            userId: nextUser.id,
          })
        } catch (profileError) {
          pendingSignedOutStateRef.current = {
            notice: createNotice(
              "error",
              "Unable to save access request",
              profileError instanceof Error ? profileError.message : "Unknown error",
            ),
            status: "error",
          }
          await supabase.auth.signOut()
          throw profileError
        }

        pendingSignedOutStateRef.current = {
          notice: getPendingSignupNotice(normalizedEmail),
          status: "pending",
        }
        setActiveFlow(null)
        await supabase.auth.signOut()
        return
      }

      const {
        data: { session: nextSession },
      } = await supabase.auth.getSession()

      if (!nextSession) {
        const notice = createNotice(
          "error",
          "Session missing",
          "Your code was accepted, but the session could not be restored.",
        )
        setAuthStatus("error")
        setAuthMessage(notice)
        throw new Error(notice.detail)
      }

      const approved = await applyApprovedSession(nextSession)
      if (!approved) {
        throw new Error(
          pendingSignedOutStateRef.current?.notice?.detail ??
            "Your account is not approved to use the app.",
        )
      }
    },
    [applyApprovedSession, configurationError, profileRepository],
  )

  const signOut = useCallback(async () => {
    if (!supabase) {
      const notice = getConfigurationNotice(configurationError)
      setAuthStatus("error")
      setAuthMessage(notice)
      throw new Error(notice.detail)
    }

    pendingSignedOutStateRef.current = {
      notice: null,
      status: "signed_out",
    }
    setActiveFlow(null)

    const { error } = await supabase.auth.signOut()
    if (error) {
      throw error
    }
  }, [configurationError])

  const resetAuthFlow = useCallback(() => {
    setActiveFlow(null)
    setAuthStatus(hasRequiredConfig ? "signed_out" : "error")
    setAuthMessage(hasRequiredConfig ? null : getConfigurationNotice(configurationError))
  }, [configurationError, hasRequiredConfig])

  const value = useMemo<AuthContextValue>(
    () => ({
      authMessage,
      authStatus,
      configurationError,
      hasRequiredConfig,
      initialized,
      isAdmin: Boolean(profile?.is_admin),
      isApproved: profile?.status === "approved",
      isAuthenticated: Boolean(session?.user),
      profile,
      resendOtp,
      requestOtp,
      resetAuthFlow,
      session,
      signOut,
      user: session?.user ?? null,
      verifyOtp,
    }),
    [
      authMessage,
      authStatus,
      configurationError,
      hasRequiredConfig,
      initialized,
      profile,
      resendOtp,
      requestOtp,
      resetAuthFlow,
      session,
      signOut,
      verifyOtp,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.")
  }
  return context
}
