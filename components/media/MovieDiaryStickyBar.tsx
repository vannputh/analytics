"use client"

import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

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
}

export function MovieDiaryStickyBar({
  searchQuery,
  onSearchQueryChange,
  onJumpToSection,
  sectionJumps,
}: MovieDiaryStickyBarProps) {
  const hasSearch = searchQuery.trim().length > 0

  return (
    <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-3 overflow-x-auto scrollbar-hide">
        <div className="hidden sm:flex items-center gap-1.5 text-muted-foreground flex-shrink-0">
          <Search className="h-3.5 w-3.5" />
          <span className="text-xs font-mono uppercase tracking-wider">Search & Jump</span>
        </div>

        <Separator orientation="vertical" className="h-6 hidden sm:block" />

        <div className="relative w-full min-w-[220px] sm:min-w-[260px] max-w-xl">
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

        <Separator orientation="vertical" className="h-6" />

        {sectionJumps.map((section) => (
          <Button
            key={section.key}
            variant="ghost"
            size="sm"
            className="h-8 px-2 shrink-0 text-xs font-mono uppercase tracking-wider"
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
