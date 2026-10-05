export type AuthMode = "login" | "signup"

export type AuthStatus =
  | "approved"
  | "awaiting_code"
  | "error"
  | "initializing"
  | "pending"
  | "rejected"
  | "signed_out"

export type AuthStatusTone = "info" | "success" | "warning" | "error"

export interface AuthStatusNotice {
  detail: string
  title: string
  tone: AuthStatusTone
}
