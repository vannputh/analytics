"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

interface SignupFormProps {
  email: string
  onEmailChange: (email: string) => void
  onSubmit: (e: React.FormEvent) => void
  loading: boolean
}

export function SignupForm({ email, onEmailChange, onSubmit, loading }: SignupFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          Email Address
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          disabled={loading}
          required
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground font-mono">
          Your request will be reviewed by an administrator
        </p>
      </div>
      <Button
        type="submit"
        className="w-full font-mono text-xs uppercase tracking-wider"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
            Submitting...
          </>
        ) : (
          "Request Access"
        )}
      </Button>
    </form>
  )
}
