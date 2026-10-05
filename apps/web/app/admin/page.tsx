import { redirect } from "next/navigation"
import { checkIsAdmin } from "@/lib/admin-actions"
import { AdminLayout } from "@/components/admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, Shield } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function AdminDashboard() {
  const isAdmin = await checkIsAdmin()

  if (!isAdmin) {
    redirect("/")
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold font-sans mb-2">Admin Dashboard</h2>
          <p className="text-muted-foreground font-mono text-sm">
            Manage user access and requests
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
                Pending Requests
              </CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold font-mono">--</div>
                  <p className="text-xs text-muted-foreground font-mono mt-1">
                    Awaiting approval
                  </p>
                </div>
                <Link href="/admin/requests">
                  <Button variant="outline" size="sm" className="font-mono text-xs">
                    View
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
                All Users
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold font-mono">--</div>
                  <p className="text-xs text-muted-foreground font-mono mt-1">
                    Total users
                  </p>
                </div>
                <Link href="/admin/users">
                  <Button variant="outline" size="sm" className="font-mono text-xs">
                    View
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
                Admins
              </CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div>
                <div className="text-2xl font-bold font-mono">--</div>
                <p className="text-xs text-muted-foreground font-mono mt-1">
                  Admin users
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
