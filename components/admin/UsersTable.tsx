"use client"

import { useState } from "react"
import { UserProfile } from "@/lib/database.types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Loader2, Shield } from "lucide-react"
import { toast } from "sonner"
import { updateUserAdminRole } from "@/lib/admin-actions"

interface UsersTableProps {
  users: UserProfile[]
  onUpdate: () => Promise<void>
}

export function UsersTable({ users, onUpdate }: UsersTableProps) {
  const [updatingRoleUserId, setUpdatingRoleUserId] = useState<string | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default'
      case 'pending':
        return 'secondary'
      case 'rejected':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const handleToggleAdminRole = async (userId: string, currentValue: boolean) => {
    setUpdatingRoleUserId(userId)
    const result = await updateUserAdminRole(userId, !currentValue)

    if (!result.success) {
      toast.error(result.error || "Failed to update admin role")
      setUpdatingRoleUserId(null)
      return
    }

    toast.success(!currentValue ? "Admin access granted" : "Admin access removed")
    await onUpdate()
    setUpdatingRoleUserId(null)
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground font-mono text-sm">No users found</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Mobile card view */}
      <div className="sm:hidden space-y-2">
        {users.map((user) => (
          <div
            key={user.id}
            className="border rounded-lg p-3 bg-card/40 flex flex-col gap-1.5"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-xs text-muted-foreground uppercase">Email</span>
              </div>
              <Badge variant={getStatusColor(user.status)} className="font-mono text-[10px] px-1.5 py-0">
                {user.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs break-all">
                {user.email}
              </span>
              {user.is_admin && (
                <Shield className="h-3 w-3 text-primary shrink-0" />
              )}
            </div>
            <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
              <span className="font-mono">
                Role: {user.is_admin ? "Admin" : "User"}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
              <span className="font-mono">
                Requested: {new Date(user.requested_at).toLocaleDateString()}
              </span>
              <span className="font-mono">
                Approved: {user.approved_at ? new Date(user.approved_at).toLocaleDateString() : "—"}
              </span>
            </div>
            <div className="pt-1">
              <Button
                size="sm"
                variant={user.is_admin ? "outline" : "default"}
                className="font-mono text-xs w-full"
                disabled={updatingRoleUserId === user.user_id}
                onClick={() => handleToggleAdminRole(user.user_id, user.is_admin)}
              >
                {updatingRoleUserId === user.user_id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : user.is_admin ? (
                  "Remove Admin"
                ) : (
                  "Make Admin"
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="border rounded-lg overflow-x-auto hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-mono text-xs uppercase">Email</TableHead>
              <TableHead className="font-mono text-xs uppercase">Status</TableHead>
              <TableHead className="font-mono text-xs uppercase">Role</TableHead>
              <TableHead className="font-mono text-xs uppercase">Requested</TableHead>
              <TableHead className="font-mono text-xs uppercase">Approved</TableHead>
              <TableHead className="font-mono text-xs uppercase text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-mono text-sm">
                  <div className="flex items-center gap-2">
                    {user.email}
                    {user.is_admin && (
                      <Shield className="h-3 w-3 text-primary" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(user.status)} className="font-mono text-xs">
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {user.is_admin ? 'Admin' : 'User'}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {new Date(user.requested_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {user.approved_at ? new Date(user.approved_at).toLocaleDateString() : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant={user.is_admin ? "outline" : "default"}
                    className="font-mono text-xs"
                    disabled={updatingRoleUserId === user.user_id}
                    onClick={() => handleToggleAdminRole(user.user_id, user.is_admin)}
                  >
                    {updatingRoleUserId === user.user_id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : user.is_admin ? (
                      "Remove Admin"
                    ) : (
                      "Make Admin"
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
