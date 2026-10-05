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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface ApprovalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "approve" | "reject"
  onConfirm: (reason?: string) => void
}

export function ApprovalDialog({ open, onOpenChange, mode, onConfirm }: ApprovalDialogProps) {
  const [reason, setReason] = useState("")

  const handleConfirm = () => {
    if (mode === "reject") {
      onConfirm(reason)
    } else {
      onConfirm()
    }
    setReason("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-mono">
            {mode === "approve" ? "Approve User" : "Reject User"}
          </DialogTitle>
          <DialogDescription className="font-mono text-xs">
            {mode === "approve"
              ? "This user will be granted access to the application."
              : "This user will be denied access to the application."}
          </DialogDescription>
        </DialogHeader>

        {mode === "reject" && (
          <div className="space-y-2">
            <Label htmlFor="reason" className="font-mono text-xs uppercase">
              Reason (Optional)
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter a reason for rejection..."
              className="font-mono text-sm"
              rows={3}
            />
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="font-mono text-xs"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            variant={mode === "approve" ? "default" : "destructive"}
            className="font-mono text-xs"
          >
            {mode === "approve" ? "Approve" : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
