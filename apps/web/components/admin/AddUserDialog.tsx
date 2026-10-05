"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"

interface AddUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (payload: { email: string; isAdmin: boolean }) => Promise<boolean>
}

export function AddUserDialog({ open, onOpenChange, onConfirm }: AddUserDialogProps) {
  const [email, setEmail] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    const normalizedEmail = email.toLowerCase().trim()
    if (!normalizedEmail) return

    setSubmitting(true)
    try {
      const success = await onConfirm({ email: normalizedEmail, isAdmin })
      if (success) {
        setEmail("")
        setIsAdmin(false)
        onOpenChange(false)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !submitting) {
      setEmail("")
      setIsAdmin(false)
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-mono">Add User</DialogTitle>
          <DialogDescription className="font-mono text-xs">
            Invite a user by email and approve them immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-user-email" className="font-mono text-xs uppercase">
              Email Address
            </Label>
            <Input
              id="new-user-email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={submitting}
              className="font-mono text-sm"
              required
            />
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              id="new-user-admin"
              checked={isAdmin}
              onCheckedChange={(checked) => setIsAdmin(checked === true)}
              disabled={submitting}
            />
            <Label htmlFor="new-user-admin" className="font-mono text-xs uppercase cursor-pointer">
              Grant Admin Access
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={submitting}
            className="font-mono text-xs"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !email.trim()}
            className="font-mono text-xs"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Adding...
              </>
            ) : (
              "Add User"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
