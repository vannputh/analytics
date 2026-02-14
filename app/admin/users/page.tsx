"use client"

import { useEffect, useState } from "react"
import { AdminLayout, UsersTable } from "@/components/admin"
import { listAllUsers } from "@/lib/admin-actions"
import { UserProfile } from "@/lib/database.types"
import { Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)

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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold font-sans mb-2">All Users</h2>
          <p className="text-muted-foreground font-mono text-sm">
            View and manage all users in the system
          </p>
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
              <UsersTable users={users} />
            </TabsContent>

            <TabsContent value="approved">
              <UsersTable users={approvedUsers} />
            </TabsContent>

            <TabsContent value="pending">
              <UsersTable users={pendingUsers} />
            </TabsContent>

            <TabsContent value="rejected">
              <UsersTable users={rejectedUsers} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AdminLayout>
  )
}
