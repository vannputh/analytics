"use client"

import { Button } from "@/components/ui/button"

interface AuthToggleProps {
  mode: "login" | "signup"
  onToggle: () => void
}

export function AuthToggle({ mode, onToggle }: AuthToggleProps) {
  return (
    <div className="text-center text-sm font-mono">
      <span className="text-muted-foreground">
        {mode === "login" ? "Don't have access? " : "Already have access? "}
      </span>
      <Button
        type="button"
        variant="link"
        onClick={onToggle}
        className="p-0 h-auto font-mono text-xs"
      >
        {mode === "login" ? "Request Access" : "Login"}
      </Button>
    </div>
  )
}
