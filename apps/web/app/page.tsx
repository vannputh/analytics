"use client"

import { useRouter } from "next/navigation"
import { Hero, Features, Navbar } from "@/components/landing"
import { ThemeProvider } from "@/components/theme-provider"

export default function LandingPage() {
  const router = useRouter()

  const handleRequestAccess = () => {
    router.push("/login")
  }

  const handleLogin = () => {
    router.push("/login")
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar onRequestAccess={handleRequestAccess} onLogin={handleLogin} />
        <main id="main-content" tabIndex={-1} className="flex-1 pt-16 outline-none">
          <Hero onRequestAccess={handleRequestAccess} onLogin={handleLogin} />
          <Features />
        </main>
      </div>
    </ThemeProvider>
  )
}
