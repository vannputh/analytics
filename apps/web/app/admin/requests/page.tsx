"use client"

import { useEffect, useState } from "react"
import { AdminLayout, RequestsTable } from "@/components/admin"
import { listPendingRequests } from "@/lib/admin-actions"
import { UserProfile } from "@/lib/database.types"
import { Loader2 } from "lucide-react"

export default function RequestsPage() {
  const [requests, setRequests] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)

  const loadRequests = async () => {
    setLoading(true)
    const result = await listPendingRequests()
    if (result.success && result.data) {
      setRequests(result.data)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadRequests()
  }, [])

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold font-sans mb-2">Pending Requests</h2>
          <p className="text-muted-foreground font-mono text-sm">
            Review and approve user access requests
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <RequestsTable requests={requests} onUpdate={loadRequests} />
        )}
      </div>
    </AdminLayout>
  )
}
