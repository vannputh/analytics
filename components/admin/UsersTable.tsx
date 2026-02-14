"use client"

import { UserProfile } from "@/lib/database.types"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Shield } from "lucide-react"

interface UsersTableProps {
  users: UserProfile[]
}

export function UsersTable({ users }: UsersTableProps) {
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

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground font-mono text-sm">No users found</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-mono text-xs uppercase">Email</TableHead>
            <TableHead className="font-mono text-xs uppercase">Status</TableHead>
            <TableHead className="font-mono text-xs uppercase">Role</TableHead>
            <TableHead className="font-mono text-xs uppercase">Requested</TableHead>
            <TableHead className="font-mono text-xs uppercase">Approved</TableHead>
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
