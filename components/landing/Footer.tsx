"use client"

import { Film } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo and tagline */}
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Film className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold font-mono">analytics</p>
              <p className="text-xs text-muted-foreground font-mono">Track. Analyze. Remember.</p>
            </div>
          </div>

          {/* Tech stack */}
          <div className="text-center md:text-right">
            <p className="text-xs text-muted-foreground font-mono">
              Built with Next.js, React, Supabase, and AI
            </p>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              © {new Date().getFullYear()} All rights reserved
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
