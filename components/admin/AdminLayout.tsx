"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Users, UserCheck, LayoutDashboard, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Requests", href: "/admin/requests", icon: UserCheck },
  { name: "All Users", href: "/admin/users", icon: Users },
]

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-bold font-mono">Admin Panel</h1>
              <nav className="flex items-center gap-1">
                {navigation.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link key={item.name} href={item.href}>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        size="sm"
                        className="font-mono text-xs gap-2"
                      >
                        <Icon className="h-3 w-3" />
                        {item.name}
                      </Button>
                    </Link>
                  )
                })}
              </nav>
            </div>
            <Link href="/media/analytics">
              <Button variant="outline" size="sm" className="font-mono text-xs gap-2">
                <ArrowLeft className="h-3 w-3" />
                Back to App
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  )
}
