"use client"

import { useEffect, useState } from "react"
import { AdminLayout, AddUserDialog, UsersTable } from "@/components/admin"
import { addUserByAdmin, listAllUsers } from "@/lib/admin-actions"
import { UserProfile } from "@/lib/database.types"
import { Loader2, UserPlus } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  const loadUsers = async () => {
    setLoading(true)
    const result = await listAllUsers()
    if (result.success && result.data) {
      setUsers(result.data)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const approvedUsers = users.filter(u => u.status === 'approved')
  const pendingUsers = users.filter(u => u.status === 'pending')
  const rejectedUsers = users.filter(u => u.status === 'rejected')

  const handleAddUser = async ({ email, isAdmin }: { email: string; isAdmin: boolean }) => {
    const result = await addUserByAdmin(email, isAdmin)

    if (!result.success) {
      toast.error(result.error || "Failed to add user")
      return false
    }

    toast.success("User added successfully")
    await loadUsers()
    return true
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-3xl font-bold font-sans mb-2">All Users</h2>
              <p className="text-muted-foreground font-mono text-sm">
                View and manage all users in the system
              </p>
            </div>
            <Button
              onClick={() => setAddDialogOpen(true)}
              className="font-mono text-xs uppercase tracking-wider gap-2"
            >
              <UserPlus className="h-3 w-3" />
              Add User
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList className="font-mono">
              <TabsTrigger value="all" className="text-xs">
                All ({users.length})
              </TabsTrigger>
              <TabsTrigger value="approved" className="text-xs">
                Approved ({approvedUsers.length})
              </TabsTrigger>
              <TabsTrigger value="pending" className="text-xs">
                Pending ({pendingUsers.length})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="text-xs">
                Rejected ({rejectedUsers.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <UsersTable users={users} onUpdate={loadUsers} />
            </TabsContent>

            <TabsContent value="approved">
              <UsersTable users={approvedUsers} onUpdate={loadUsers} />
            </TabsContent>

            <TabsContent value="pending">
              <UsersTable users={pendingUsers} onUpdate={loadUsers} />
            </TabsContent>

            <TabsContent value="rejected">
              <UsersTable users={rejectedUsers} onUpdate={loadUsers} />
            </TabsContent>
          </Tabs>
        )}
      </div>
      <AddUserDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onConfirm={handleAddUser}
      />
    </AdminLayout>
  )
}
