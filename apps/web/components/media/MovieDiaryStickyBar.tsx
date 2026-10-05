"use client"

import { useState, useEffect } from "react"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

export type MovieDiarySectionKey = "watching" | "watched" | "planned" | "holdDropped"

interface SectionJump {
  key: MovieDiarySectionKey
  label: string
}

interface MovieDiaryStickyBarProps {
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  onJumpToSection: (section: MovieDiarySectionKey) => void
  sectionJumps: SectionJump[]
  activeSection?: MovieDiarySectionKey | null
}

export function MovieDiaryStickyBar({
  searchQuery,
  onSearchQueryChange,
  onJumpToSection,
  sectionJumps,
  activeSection,
}: MovieDiaryStickyBarProps) {
  const hasSearch = searchQuery.trim().length > 0
  const [isCompact, setIsCompact] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsCompact(window.scrollY > 10)
    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div
        className={cn(
          "flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-3 overflow-x-auto scrollbar-hide transition-[padding] duration-200",
          isCompact ? "pr-32 sm:pr-36" : ""
        )}
      >
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search all entries..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                e.stopPropagation()
              }
            }}
            className="h-8 pl-10 pr-10"
          />
          {hasSearch && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => onSearchQueryChange("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Separator orientation="vertical" className="h-6 shrink-0" />

        {sectionJumps.map((section) => (
          <Button
            key={section.key}
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 px-2 shrink-0 text-xs font-mono uppercase tracking-wider transition-colors",
              activeSection === section.key
                ? "bg-foreground text-background hover:bg-foreground/90 hover:text-background"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => onJumpToSection(section.key)}
          >
            {section.label}
          </Button>
        ))}

        {hasSearch && (
          <Badge variant="outline" className="h-5 shrink-0 font-mono text-[10px]">
            search active
          </Badge>
        )}
      </div>
    </div>
  )
}
